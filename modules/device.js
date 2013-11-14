var TENANT_CONFIGS = 'tenant.configs';
var USER_MANAGER = 'user.manager';
var common = require("/modules/common.js");

var device = (function () {

    var userModule = require('user.js').user;
    var user = '';
    var groupModule = require('group.js').group;
    var group = '';

	
    var configs = {
        CONTEXT: "/"
    };

    var carbon = require('carbon');
	var server = function(){
		return application.get("SERVER");
	}

    var log = new Log();
    var gcm = require('gcm').gcm;
	var configs = function (tenantId) {
	    var config = application.get(TENANT_CONFIGS);
		if (!tenantId) {
	        return config;
	    }
	    return config[tenantId] || (config[tenantId] = {});
	};			
	/**
	 * Returns the user manager of the given tenant.
	 * @param tenantId
	 * @return {*}
	 */
	var userManager = function (tenantId) {

	    var config = configs(tenantId);

	    if (!config || !config[USER_MANAGER]) {

			var um = new carbon.user.UserManager(server, tenantId);
			config[USER_MANAGER] = um;
	        return um;
	    }
        var uManager = configs(tenantId)[USER_MANAGER];
	    return uManager;
	};			

    var db;
    var module = function (dbs) {
        db = dbs;

        user = new userModule(db);
        group = new groupModule(db);

    };

    function mergeRecursive(obj1, obj2) {
        for (var p in obj2) {
            try {
                // Property in destination object set; update its value.
                if (obj2[p].constructor == Object) {
                    obj1[p] = MergeRecursive(obj1[p], obj2[p]);
                } else {
                    obj1[p] = obj2[p];
                }
            } catch (e) {
                // Property in destination object not set; create it and set its value.
                obj1[p] = obj2[p];
            }
        }
        return obj1;
    }

    function checkPermission(role, deviceId, operationName, that){
        var policy = require('policy').policy;
        policy.init();
        var decision = null;
        var action = 'POST';
        if(role == 'admin'){
            log.debug("subject :"+role);
            log.debug("action :"+action);
            log.debug("resource :"+operationName);
            decision = policy.getDecision(operationName, action, role, "");
            log.debug("Test decision :"+decision);
        }else if(role == 'mdmadmin'){
            log.debug("Test2");
            decision = policy.getDecision(operationName, action, role, "");
        }else{
            log.debug("Test3");
            var result = db.query("select * from devices where id ="+deviceId);
            var userId = result[0].user_id;
            var roleList = user.getUserRoles({'username':userId});
            for(var i = 0;i<roleList.length;i++){
                var decision = policy.getDecision(operationName,action,roleList[i],"");
                log.debug("Test decision :"+decision);
                if(decision=="Permit"){
                    break;
                }
            }
        }
        if(decision=="Permit"){
            return true;

        }else{
            return false;
        }

    }
    function policyByOsType(jsonData,os){
        for(var n=0;n<jsonData.length;n++){
            if(jsonData[n].code == '509B'||jsonData[n].code == '528B'){
                var apps = jsonData[n].data;
                var appsByOs = new Array();
                for(var k=0;k<apps.length;k++){
                    if(apps[k].os == os){
                        appsByOs.push(apps[k]);
                    }
                }
                var obj1 = {};
                obj1.code = jsonData[n].code;
                obj1.data = appsByOs;
                jsonData[n] = obj1;
            }
        }
        return  jsonData;
    }
    
	function invokeInitialFunctions(ctx) {
		
		var db = application.get('db');
		var devices = db.query("SELECT * FROM devices WHERE udid = " + stringify(ctx.deviceid));
        var deviceID = devices[0].id;
        var userId = devices[0].user_id;

        sendMessageToIOSDevice({'deviceid':deviceID, 'operation': "INFO", 'data': "hi"});
        sendMessageToIOSDevice({'deviceid':deviceID, 'operation': "APPLIST", 'data': "hi"});
        
        var upresult = db.query("SELECT policies.content as data, policies.type FROM policies, user_policy_mapping where policies.id = user_policy_mapping.policy_id && user_policy_mapping.user_id = ?", String(userId));
        if(upresult!=undefined && upresult != null && upresult[0] != undefined && upresult[0] != null ){
            log.debug("Policy Payload :"+upresult[0].data);
            var jsonData = parse(upresult[0].data);
            sendMessageToIOSDevice({'deviceid':deviceID, 'operation': "POLICY", 'data': jsonData});
            return true;
        }

        var ppresult = db.query("SELECT policies.content as data, policies.type FROM policies,platform_policy_mapping where policies.id = platform_policy_mapping.policy_id && platform_policy_mapping.platform_id = 'ios'");
        log.debug(ppresult[0]);
        if(ppresult!=undefined && ppresult != null && ppresult[0] != undefined && ppresult[0] != null ){
            log.debug("Policy Payload :"+ppresult[0].data);
            var jsonData = parse(ppresult[0].data);
            sendMessageToIOSDevice({'deviceid':deviceID, 'operation': "POLICY", 'data': jsonData});
            return true;
        }

        var roleList = user.getUserRoles({'username':userId});
        var removeRoles = new Array("Internal/everyone", "portal", "wso2.anonymous.role", "reviewer","private_kasun:wso2mobile.com");
        var roles = common.removeNecessaryElements(roleList,removeRoles);
        var role = roles[0];
        var gpresult = db.query("SELECT policies.content as data, policies.type FROM policies,group_policy_mapping where policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",role+'');
        log.debug(gpresult[0]);
        if(gpresult != undefined && gpresult != null && gpresult[0] != undefined && gpresult[0] != null){
            log.debug("Policy Payload :"+gpresult[0].data);
            var jsonData = parse(gpresult[0].data);
            sendMessageToIOSDevice({'deviceid':deviceID, 'operation': "POLICY", 'data': jsonData});
        }

    }

    function versionComparison(osVersion,platformId,featureId){
        var deviceOsVersion = osVersion.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "");
        for (var i = deviceOsVersion.length; i < 4; i++) {
            deviceOsVersion += "0";
        }
        var platformFeatures = db.query("SELECT id, template, min_version FROM platformfeatures WHERE (platform_id = ? AND feature_id = ?)",platformId, featureId);
        var minVersion = platformFeatures[0].min_version;
        minVersion = minVersion.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "");
        for (var i = minVersion.length; i < 4; i++) {
            minVersion += "0";
        }
        if(parseInt(deviceOsVersion)>parseInt(minVersion)){
            return true;
        }else{
            return false;
        }
    }

	function sendMessageToDevice(ctx){
        var payLoad = stringify(ctx.data);
        var deviceId = ctx.deviceid;
        var operationName = ctx.operation;

        var devices = db.query("SELECT reg_id, os_version, platform_id, user_id FROM devices WHERE id = ?", deviceId+"");
        if(devices == undefined || devices == null || devices[0]== undefined || devices[0] == null ){
            return false;
        }
        var userID = devices[0].user_id;
        var osVersion = devices[0].os_version;
        var platformId = devices[0].platform_id;
        var regId = devices[0].reg_id;

        var features = db.query("SELECT * FROM features WHERE name LIKE ?", ctx.operation);
        if(features == undefined || features == null || features[0]== undefined || features[0] == null ){
            return false;
        }
        var featureCode = features[0].code;
        var featureId = features[0].id;
        var featureDescription = features[0].description;

        /*var versionCompatibility = versionComparison(osVersion, platformId, featureId);
        if(versionCompatibility == false){
            return false;
        }*/

        var currentDate = common.getCurrentDateTime();
        db.query("INSERT INTO notifications (device_id, group_id, message, status, sent_date, feature_code, user_id ,feature_description) values(?, ?, ?, 'P', ?, ?, ?, ?)", deviceId, -1, payLoad, currentDate, featureCode, userID,featureDescription);
        var lastRecord = db.query("SELECT LAST_INSERT_ID()");
        var lastRecordJson = lastRecord[0];
        var token = lastRecordJson["LAST_INSERT_ID()"];
        var gcmMSG = gcm.sendViaGCMtoMobile(regId, featureCode, token, payLoad, 3);
        log.debug(gcmMSG);
        return true;
    }
    
    function sendMessageToIOSDevice(ctx){
		log.debug("CTX >>>>>"+stringify(ctx));
        var message = stringify(ctx.data);
        var devices = db.query("SELECT reg_id FROM devices WHERE id = ?", ctx.deviceid+"");
        
        if(devices == null || devices == undefined || devices[0] == null || devices[0] == undefined) {
        	return;
        }
        
        var regId = devices[0].reg_id;
        var regIdJsonObj = parse(regId);

        if(ctx.operation=="CLEARPASSWORD"){
            var unlockToken = regIdJsonObj.unlockToken;
            message = {};
            message.unlock_token = unlockToken;
            message = stringify(message);
            log.debug("Messagee"+message);
        }

        var pushMagicToken = regIdJsonObj.magicToken;
        var deviceToken = regIdJsonObj.token;

		log.error("device id : "+ ctx.deviceid);
		log.error("device token : "+ deviceToken);
		log.error("magic token : "+ pushMagicToken);

        var users = db.query("SELECT user_id FROM devices WHERE id = ?", ctx.deviceid+"");
        var userId = users[0].user_id;


        var datetime =  common.getCurrentDateTime();

        log.error("Test operation"+ctx.operation);

        var features = db.query("SELECT id, code, description FROM features WHERE name LIKE ?", ctx.operation+"");
        
        if(features == null || features == undefined || features[0] == null || features[0] == undefined) {
        	return false;
        }
        
        var featureCode = features[0].code;
        var featureDescription = features[0].description;

        db.query("INSERT INTO notifications (device_id, group_id, message, status, sent_date, feature_code, user_id, feature_description) values( ?, '1', ?, 'P', ?, ?, ?, ?)", 
        	ctx.deviceid, message, datetime, featureCode, userId, featureDescription);

		common.initAPNS(deviceToken, pushMagicToken);

        return true;
    }
    
    function checkPendingOperations() {
    	
    	var pendingOperations = db.query("SELECT id, device_id FROM notifications WHERE status = 'P' AND device_id IN (SELECT id FROM devices WHERE platform_id IN (SELECT id FROM platforms WHERE type_name = 'iOS')) ORDER BY sent_date DESC;");
    	
    	for(var i = 0; i < pendingOperations.length; i++) {
    		
    		var deviceId = pendingOperations[i].device_id;
    		var devices = db.query("SELECT reg_id FROM devices WHERE id = ?", deviceId);

    		if(devices != null && devices[0] != null && devices != undefined && devices[0] != undefined) {
    			var regId = devices[0].reg_id;
		    	var regIdJsonObj = parse(regId);
		    	var pushMagicToken = regIdJsonObj.magicToken;
		        var deviceToken = regIdJsonObj.token;
		    	
		    	common.initAPNS(deviceToken, pushMagicToken);		
    		}
    	}

    }

    // prototype
    module.prototype = {
        constructor: module,
        isRegistered: function(ctx){
            if(ctx.regid != undefined && ctx.regid != null && ctx.regid != ''){
                var result = db.query("SELECT reg_id FROM devices WHERE reg_id = ? && deleted = 0", ctx.regid);
                var state = (result != null && result != undefined && result[0] != null && result[0] != undefined);
                return state;
            }else if(ctx.udid != undefined && ctx.udid != null && ctx.udid != ''){
                var result = db.query("SELECT udid FROM devices WHERE udid = ? && deleted = 0", ctx.udid);
                var state = (result != null && result != undefined && result[0] != null && result[0] != undefined);
                return state;
            }
        },
        getAppPolicyData:function(userId, platformId, role ){

            var upresult = db.query("SELECT policies.content as data, policies.type FROM policies, user_policy_mapping where category = 2 && policies.id = user_policy_mapping.policy_id && user_policy_mapping.user_id = ?",String(userId));
            if(upresult!=undefined && upresult != null && upresult[0] != undefined && upresult[0] != null ){
                log.debug("Policy Payload :"+upresult[0].data);
                var jsonData = parse(upresult[0].data);
                jsonData = policyByOsType(jsonData,'android');
                return jsonData;
            }
            var ppresult = db.query("SELECT policies.content as data, policies.type FROM policies,platform_policy_mapping where category = 2 && policies.id = platform_policy_mapping.policy_id && platform_policy_mapping.platform_id = ?",platformId);
            log.debug(ppresult[0]);
            if(ppresult!=undefined && ppresult != null && ppresult[0] != undefined && ppresult[0] != null ){
                log.debug("Policy Payload :"+ppresult[0].data);
                var jsonData = parse(ppresult[0].data);
                jsonData = policyByOsType(jsonData,'android');
                return jsonData;
            }
            var gpresult = db.query("SELECT policies.content as data, policies.type FROM policies,group_policy_mapping where category = 2 && policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",role+'');
            log.debug(gpresult[0]);
            if(gpresult != undefined && gpresult != null && gpresult[0] != undefined && gpresult[0] != null){
                log.debug("Policy Payload :"+gpresult[0].data);
                var jsonData = parse(gpresult[0].data);
                jsonData = policyByOsType(jsonData,'android');
                return jsonData;
            }
            return null;
        },
        register: function(ctx){
            var log = new Log();
			ctx.email = ctx.email+"@carbon.super";
			var tenantUser = carbon.server.tenantUser(ctx.email);
		    var userId = tenantUser.username;
			var tenantId = tenantUser.tenantId;
			
            var platforms = db.query("SELECT id FROM platforms WHERE name = ?", ctx.platform);//from device platform comes as iOS and Android then convert into platform id to save in device table
            var platformId = platforms[0].id;

            var createdDate =  common.getCurrentDateTime();

            if(ctx.regid!=null){
                var result = db.query("SELECT * FROM devices WHERE reg_id= ?", ctx.regid);

                if(result[0]==null){

                    var roleList = user.getUserRoles({'username':userId});
                    var removeRoles = new Array("Internal/everyone", "portal", "wso2.anonymous.role", "reviewer","private_kasun:wso2mobile.com");
                    var roles = common.removeNecessaryElements(roleList,removeRoles);
                    var role = roles[0];

                    db.query("INSERT INTO devices (tenant_id, os_version, created_date, properties, reg_id, status, deleted, user_id, platform_id, vendor, udid) VALUES(?, ?, ?, ?, ?,'A','0', ?, ?, ?,'0');", tenantId, ctx.osversion, createdDate, ctx.properties, ctx.regid, userId, platformId, ctx.vendor);
                    var devices = db.query("SELECT * FROM devices WHERE reg_id = ?", ctx.regid);

                    
                    var deviceID = "" + devices[0].id;
                    sendMessageToDevice({'deviceid':deviceID, 'operation': "debug", 'data': "hi"});
                    sendMessageToDevice({'deviceid':deviceID, 'operation': "APPLIST", 'data': "hi"});
                    sendMessageToDevice({'deviceid':deviceID, 'operation': "DATAUSAGE", 'data': "hi"});

                    var appPolicyData = this.getAppPolicyData(userId,ctx.platform,role);
                    if(appPolicyData != null){
                        appPolicyData = appPolicyData[0];
                    }
                    log.debug("app policy dataaaaaaaaaaaaaaaa :"+stringify(appPolicyData));
                    //var appPolicyData = null;

                    log.debug("Initial email :"+userId);
                    var upresult = db.query("SELECT policies.content as data, policies.type FROM policies, user_policy_mapping where category = 1 && policies.id = user_policy_mapping.policy_id && user_policy_mapping.user_id = ?",String(userId));
                    if(upresult!=undefined && upresult != null && upresult[0] != undefined && upresult[0] != null ){
                        log.debug("Policy Payload :"+upresult[0].data);
                        var jsonData = parse(upresult[0].data);
                        if(appPolicyData != null && appPolicyData != null){
                            jsonData.push(appPolicyData);
                        }
                        log.debug("Policy Payload with app policy :"+stringify(jsonData));
                        sendMessageToDevice({'deviceid':deviceID, 'operation': "POLICY", 'data': jsonData});
                        return true;
                    }

                    var ppresult = db.query("SELECT policies.content as data, policies.type FROM policies,platform_policy_mapping where category = 1 && policies.id = platform_policy_mapping.policy_id && platform_policy_mapping.platform_id = ?",ctx.platform);
                    log.debug(ppresult[0]);
                    if(ppresult!=undefined && ppresult != null && ppresult[0] != undefined && ppresult[0] != null ){
                        log.debug("Policy Payload :"+ppresult[0].data);
                        var jsonData = parse(ppresult[0].data);
                        if(appPolicyData != null && appPolicyData != null){
                            jsonData.push(appPolicyData);
                        }
                        sendMessageToDevice({'deviceid':deviceID, 'operation': "POLICY", 'data': jsonData});
                        return true;
                    }

                    var gpresult = db.query("SELECT policies.content as data, policies.type FROM policies,group_policy_mapping where category = 1 && policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",role+'');
                    if(gpresult != undefined && gpresult != null && gpresult[0] != undefined && gpresult[0] != null){
                        log.debug("Policy Payload :"+gpresult[0].data);
						var jsonData = parse(gpresult[0].data);
                        if(appPolicyData != null && appPolicyData != null){
                            jsonData.push(appPolicyData);
                        }
                        jsonData.push(appPolicyData);
                        sendMessageToDevice({'deviceid':deviceID, 'operation': "POLICY", 'data': jsonData});
                    }
                    return true;
                }else{
                    db.query("UPDATE devices SET deleted = 0 WHERE reg_id = ?", ctx.regid);
                    return true;
                }
            }else{

            }
        },
        registerIOS: function(ctx){
            var tenantUser = carbon.server.tenantUser(ctx.email);
		    var userId = tenantUser.username;
			var tenantId = tenantUser.tenantId;
			
            var platforms = db.query("SELECT id FROM platforms WHERE name = ?", ctx.platform);
            var platformId = platforms[0].id;

            var createdDate = common.getCurrentDateTime();
            var devicesCheckUDID = db.query("SELECT * FROM devices WHERE udid = ?", ctx.udid);
            if(devicesCheckUDID != undefined && devicesCheckUDID != null && devicesCheckUDID[0] != undefined && devicesCheckUDID[0] != null){
                db.query("Update devices SET reg_id = ? WHERE udid = ?", ctx.regid, ctx.udid);
            }else{
                db.query("INSERT INTO devices (tenant_id, os_version, created_date, properties, reg_id, status, deleted, user_id, platform_id, vendor, udid) VALUES(?, ?, ?, ?, ?, 'A', '0', ?, ?, ?, ?)", 
                	tenantId, ctx.osversion, createdDate, stringify(ctx.properties), ctx.regid, userId, platformId, ctx.vendor, ctx.udid);
            }

            return true;
        },
        sendToDevice: function(ctx){
            log.debug("MSG format :"+stringify(ctx.data));
            log.debug(ctx.deviceid);
            log.debug(ctx.operation);
            var devices = db.query("SELECT platform_id FROM devices WHERE id = ?", ctx.deviceid+"");
            var platformID = devices[0].platform_id;
            if(platformID==1){
                return sendMessageToDevice(ctx);
            }else{
                log.debug("platformID"+platformID);
                return sendMessageToIOSDevice(ctx);
            }
        },
        sendToDevices:function(ctx){
            log.debug("test sendToDevices :"+stringify(ctx.params.data));
            log.debug(ctx.devices[0]);
           var devices =  ctx.devices;
           for(var i=0;i<devices.length;i++){
                this.sendToDevice({'deviceid':devices[i],'operation':ctx.operation,'data':ctx.params.data});
           }
        },
        getPendingOperationsFromDevice: function(ctx){
			
            var deviceList = db.query("SELECT id FROM devices WHERE udid = " + ctx.udid);
            
            if(deviceList[0]!=null) {
                var deviceID = String(deviceList[0].id);
                var pendingFeatureCodeList=db.query("SELECT feature_code ,message, id, received_data FROM notifications WHERE notifications.status='P' AND notifications.device_id = ? ORDER BY sent_date DESC", deviceID+"");
                
                if(pendingFeatureCodeList!=undefined && pendingFeatureCodeList != null && pendingFeatureCodeList[0]!= undefined && pendingFeatureCodeList[0]!= null){
                    var id = pendingFeatureCodeList[0].id;
                    var feature_code = pendingFeatureCodeList[0].feature_code;
                    
                    if(feature_code == "500P") {
						
						var message = parse(pendingFeatureCodeList[0].message);
						var received_data = pendingFeatureCodeList[0].received_data;
						        			          	
                    	if(received_data == null || received_data == '') {

		                    var arrEmptyReceivedData = new Array();
		                    
		                    for(var i = 0; i < message.length; i++) {
		                    	var receivedObject = {};
		                    	receivedObject.status = "pending";
		                    	receivedObject.counter = "0";
		                    	receivedObject.message = message[i];
		                    	arrEmptyReceivedData.push(receivedObject);
		                    }
                    
                    		db.query("UPDATE notifications SET received_data = ? WHERE id = ?", stringify(arrEmptyReceivedData), id+"");
                    		
                    		received_data = parse(stringify(arrEmptyReceivedData));
                    	} else {
                    		received_data = parse(received_data);
                    	}
                    	
                		for(var i = 0; i < received_data.length; i++) {
							
							var counter = parseInt(received_data[i].counter);
							
	                    	if(received_data[i].status == "pending") {
	                    		
	                    		var objResponse = {};
	                    		objResponse.feature_code = received_data[i].message.code + "";
	                    		objResponse.message = stringify(received_data[i].message.data);
	                    		objResponse.id = id + "-" + i;
	                    		
	                    		received_data[i].counter = ++counter + "";
	                    		
	                    		if(counter > 3) {
	                    			received_data[i].status = "skipped";
	                    		}
	                    		
	                    		db.query("UPDATE notifications SET received_data = ? WHERE id = ?", stringify(received_data), id+"");
	                    		
	                    		if(counter > 3) {
	                    			continue;
	                    		}
	                    		
	                    		return parse(stringify(objResponse));
	                    	}
	                    }
             	
                    } else {
                    	db.query("UPDATE notifications SET status='C' WHERE id = ?", id+"");
                    }

                    return pendingFeatureCodeList[0];
                }else{
                    return null;
                }
            }else{
                return null;
            }
        },
        updateiOSTokens: function(ctx){
		
			var result = db.query("SELECT properties FROM devices WHERE udid = " + stringify(ctx.deviceid));

            if(result != null && result != undefined && result[0] != null && result[0] != undefined) {
                log.error(result);
                var properties = parse(result[0].properties);

                var platform = "" + properties["product"];
                if (platform.toLowerCase().indexOf("ipad") != -1) {
                    platform = "iPad";
                } else if (platform.toLowerCase().indexOf("ipod") != -1) {
                    platform = "iPod";
                } else {
                    platform = "iPhone";
                }

                properties["model"] = platform;

                var tokenProperties = {};
                tokenProperties["token"] = ctx.token;
                tokenProperties["unlockToken"] = ctx.unlockToken;
                tokenProperties["magicToken"] = ctx.magicToken;

                var updateResult = db.query("UPDATE devices SET properties = ?, reg_id = ? WHERE udid = ?", 
                	stringify(properties), stringify(tokenProperties), ctx.deviceid);

                if(updateResult != null && updateResult != undefined && updateResult == 1) {
                    	
					setTimeout(function(){invokeInitialFunctions(ctx)}, 2000);
                    	
                    return true;
                }
            }

            return false;
        },
        getFeaturesFromDevice: function(ctx){
            var role = ctx.role;
       	    var deviceId =  ctx.deviceid;
            log.debug("Test Role :"+role);
            var featureList = db.query("SELECT DISTINCT features.description, features.id, features.name, features.code, platformfeatures.template FROM devices, platformfeatures, features WHERE devices.platform_id = platformfeatures.platform_id AND devices.id = ? AND features.id = platformfeatures.feature_id", stringify(deviceId));
			
            var obj = new Array();
            for(var i=0; i<featureList.length; i++){
                var featureArr = {};
                var ftype = db.query("SELECT featuretype.name FROM featuretype, features WHERE features.type_id=featuretype.id AND features.id= ?", stringify(featureList[i].id));

                featureArr["name"] = featureList[i].name;
                featureArr["feature_code"] = featureList[i].code;
                featureArr["feature_type"] = ftype[0].name;
                featureArr["description"] = featureList[i].description;
                featureArr["enable"] = checkPermission(role,deviceId, featureList[i].name, this);
                //featureArr["enable"] = true;
                if(featureList[i].template === null || featureList[i].template === ""){

                }else{
                    featureArr["template"] = featureList[i].template;
                }
                obj.push(featureArr);
            }

         //   log.debug(obj);

            return obj;
        },
        sendMsgToUserDevices: function(ctx){
            var device_list = db.query("SELECT id, reg_id, os_version, platform_id FROM devices WHERE user_id = ?", ctx.userid);
            var succeeded="";
            var failed="";
            for(var i=0; i<device_list.length; i++){
                var status = this.sendToDevice({'deviceid':device_list[i].id, 'operation': ctx.operation, 'data' : ctx.data});
                if(status == true){
                    succeeded += device_list[i].id+",";
                }else{
                    failed += device_list[i].id+",";
                }
            }
            return "Succeeded : "+succeeded+", Failed : "+failed;
        },
        sendMsgToGroupDevices :function(ctx){
            var succeeded="";
            var failed="";

            var userList = group.getUsersOfGroup();

            for(var i = 0; i < userList.length; i++) {

                var objUser = {};

                var result = db.query("SELECT id FROM devices WHERE user_id = ? AND tenant_id = ?", String(userList[i].email), common.getTenantID());

                for(var j = 0; j < result.length; j++) {

                    var status = this.sendToDevice({'deviceid':result[i].id, 'operation': ctx.operation, 'data' : ctx.data});
                    if(status == true){
                        succeeded += result[i].id+",";
                    }else{
                        failed += result[i].id+",";
                    }
                }
            }
            if(succeeded != "" && failed != ""){
                return "Succeeded : "+succeeded+", Failed : "+failed;
            }else{
                return "Succeeded : "+succeeded;
            }
        },
        unRegister:function(ctx){
            if(ctx.regid!=null){
                var result = db.query("Delete from devices where reg_id = ?", ctx.regid);
                if(result == 1){
                    return true;
                }else{
                    return false
                }
            }else{
                return false;
            }
        },
        unRegisterIOS:function(ctx){

        	sendMessageToIOSDevice({'deviceid':ctx.udid, 'operation': "ENTERPRISEWIPE", 'data': ""});
        	
            if(ctx.udid != null){
                var result = db.query("DELETE FROM devices WHERE udid = ?", ctx.udid);
                if(result == 1){
                    return true;
                }else{
                    return false
                }
            }else{
                return false;
            }
        },
        enforcePolicy:function(ctx){
            var result = db.query("SELECT * from devices where id = ?",ctx.id);
            var userId = result[0].user_id;
            var roles = this.getUserRoles({'username':userId});
            var roleList = parse(roles);
            log.debug(roleList[0]);
            var gpresult = db.query("SELECT policies.content as data FROM policies,group_policy_mapping where policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",roleList[0]);
            log.debug(gpresult[0]);
            sendMessageToDevice({'deviceid':deviceID, 'operation': "POLICY", 'data': gpresult[0].data});
        },
        getLicenseAgreement: function(ctx){
            var path = "/license/license.txt";
            var file = new File(path);
            file.open("r");
            var message = "";
            message = file.readAll();
           // print(message);
            file.close();
            return message;
        },monitoring:function(ctx){
            application.put("that",this);
            try{
                setInterval((application.get("that")).monitor({}),100000);
            }catch (e){
               // setInterval(this.monitoring({}),10000);
                log.debug("Error In Monitoring");
            }

        },
        monitor:function(ctx){
            log.debug("monitor");
                var result = db.query("SELECT * from devices");
                for(var i=0; i<result.length; i++){

                    var deviceId = result[i].id;
                    log.debug("Device ID :"+deviceId);
                    var platform = '';
                    if(result[0].platform_id == 1){
                        platform = 'android';
                    } else if(result[0].platform_id == 2) {
                        platform = 'ios';
                    } else if(result[0].platform_id == 3) {
                        platform = 'ios';
                    } else if(result[0].platform_id == 4) {
                        platform = 'ios';
                    }
                    var operation = 'MONITORING';
                    var data = {};
                    var userId = result[i].user_id;
                    this.sendToDevice({'deviceid':deviceId,'operation':'debug','data':{}});
                    this.sendToDevice({'deviceid':deviceId,'operation':'APPLIST','data':{}});
                    log.debug("Test1");

                    var roleList = user.getUserRoles({'username':userId});
                    var removeRoles = new Array("Internal/everyone", "portal", "wso2.anonymous.role", "reviewer","private_kasun:wso2mobile.com");
                    var roles = common.removeNecessaryElements(roleList,removeRoles);
                    var role = roles[0];
                    log.debug("Roleeeee"+role);

                  //  var appPolicyData = this.getAppPolicyData(userId,platform,role);
                    var appPolicyData = null;
                    log.info("Original User Email :"+userId);
                    var upresult = db.query("SELECT policies.content as data, policies.type FROM policies, user_policy_mapping where policies.id = user_policy_mapping.policy_id && user_policy_mapping.user_id = ?",String(userId));

                    if(upresult!=undefined && upresult != null && upresult[0] != undefined && upresult[0] != null ){
                        log.debug("Policy Payload :"+upresult[0].data);
                        var jsonData = parse(upresult[0].data);
                        if(appPolicyData!=undefined && appPolicyData!= null){
                            jsonData.push(appPolicyData);
                        }
                        var obj = {};
                        obj.type = upresult[0].type;
                        obj.policies = jsonData;
                        this.sendToDevice({'deviceid':deviceId,'operation':operation,'data':obj});
                        continue;
                    }

                    var ppresult = db.query("SELECT policies.content as data, policies.type FROM policies,platform_policy_mapping where policies.id = platform_policy_mapping.policy_id && platform_policy_mapping.platform_id = ?",platform);
                    if(ppresult!=undefined && ppresult != null && ppresult[0] != undefined && ppresult[0] != null ){
                        log.debug("Policy Payload :"+ppresult[0].data);
                        var jsonData = parse(ppresult[0].data);
                        if(appPolicyData!=undefined && appPolicyData!= null){
                            jsonData.push(appPolicyData);
                        }
                        var obj = {};
                        obj.type = ppresult[0].type;
                        obj.policies = jsonData;
                        this.sendToDevice({'deviceid':deviceId,'operation':operation,'data':obj});
                        continue;
                    }



                    var gpresult = db.query("SELECT policies.content as data, policies.type FROM policies,group_policy_mapping where policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",role+'');
                    log.debug("Resulttttttttttt"+gpresult[0]);
                    if(gpresult != undefined && gpresult != null && gpresult[0] != undefined && gpresult[0] != null){
                        log.debug("Policy Payload :"+gpresult[0].data);
                        var jsonData = parse(gpresult[0].data);
                        if(appPolicyData!=undefined && appPolicyData!= null){
                            jsonData.push(appPolicyData);
                        }
                        var obj = {};
                        obj.type = gpresult[0].type;
                        obj.policies = jsonData;
                        this.sendToDevice({'deviceid':deviceId,'operation':operation,'data':obj});
                    }

                }
        },
        changeDeviceState:function(deviceId,state){
            db.query("UPDATE devices SET status = ? WHERE id = ?",state,stringify(deviceId));
        },
        updateDeviceProperties:function(deviceId, osVersion, deviceName) {
                    	
            var deviceResult = db.query("SELECT properties FROM devices WHERE id = ?", deviceId + "");
        	var properties = deviceResult[0].properties;
        	properties = parse(parse(stringify(properties)));
        	properties["device"] = deviceName;
        	
            db.query("UPDATE devices SET os_version = ?, properties = ? WHERE id = ?", osVersion, stringify(properties), deviceId + "");
        },
        getCurrentDeviceState:function(deviceId){
            var result = db.query("select status from devices where id = ?",stringify(deviceId));
            if(result != undefined && result != null && result[0] != undefined && result[0] != null){
                return result[0].status;
            }else{
                return null;
            }
        },
        invokePendingOperations:function(){
            setInterval(
           		function(){
	                checkPendingOperations();
	            }
            , 10000);
        }
    };

    return module;
})();



