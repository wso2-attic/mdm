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

    function monitor(ctx){
        var that = application.get("that");
        var result = db.query("SELECT * from devices");

        for(var i=0; i<result.length; i++){

            var deviceId = result[i].id;
            log.info("Device ID :"+deviceId);
            var platform = '';
            if(result[0].platform_id == 1){
                platform = 'android';
            }else if(result[0].platform_id == 2){
                platform = 'ios';
            }
            var operation = 'MONITORING';
            var data = {};
            var userId = result[i].user_id;
            that.sendToDevice({'deviceid':deviceId,'operation':'INFO','data':{}});
            that.sendToDevice({'deviceid':deviceId,'operation':'APPLIST','data':{}});

            var upresult = db.query("SELECT policies.content as data, policies.type FROM policies, user_policy_mapping where policies.id = user_policy_mapping.policy_id && user_policy_mapping.user_id = ?",stringify(userId));
            if(upresult!=undefined && upresult != null && upresult[0] != undefined && upresult[0] != null ){
                log.info("Policy Payload :"+gpresult[0].data);
                var jsonData = parse(gpresult[0].data);
                jsonData = policyByOsType(jsonData,'android');
                that.sendToDevice({'deviceid':deviceId,'operation':operation,'data':jsonData});
                continue;
            }

            var ppresult = db.query("SELECT policies.content as data, policies.type FROM policies,platform_policy_mapping where policies.id = platform_policy_mapping.policy_id && platform_policy_mapping.platform_id = ?",stringify(platform));
            if(ppresult!=undefined && ppresult != null && ppresult[0] != undefined && ppresult[0] != null ){
                log.info("Policy Payload :"+ppresult[0].data);
                var jsonData = parse(ppresult[0].data);
                jsonData = policyByOsType(jsonData,'android');
                that.sendToDevice({'deviceid':deviceId,'operation':operation,'data':jsonData});
                continue;
            }
            log.info("UUUUUUUUUUUUUUUU"+userId);

            var roleList = user.getUserRoles({'username':userId});

             var role = '';
             for(var i=0;i<roleList.length;i++){
                 if(roleList[i] == 'store' || roleList[i] == 'store' || roleList[i] == 'Internal/everyone'){
                    continue;
                 }else{
                    role = roleList[i];
                 break;
                 }
             }
             log.info(role);
             var gpresult = db.query("SELECT policies.content as data, policies.type FROM policies,group_policy_mapping where policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",role+'');
             log.info(gpresult[0]);
             if(gpresult != undefined && gpresult != null && gpresult[0] != undefined && gpresult[0] != null){
                log.info("Policy Payload :"+gpresult[0].data);
                var jsonData = parse(gpresult[0].data);
                jsonData = policyByOsType(jsonData,'android');
                device.sendToDevice({'deviceid':deviceId,'operation':operation,'data':jsonData});
             }

        }
    }

    function checkPermission(role, deviceId, operationName, that){
        var policy = require('policy').policy;
        policy.init();
        var decision = null;
        var action = 'POST';
        if(role == 'admin'){
            log.info("subject :"+role);
            log.info("action :"+action);
            log.info("resource :"+operationName);
            decision = policy.getDecision(operationName, action, role, "");
            log.info("Test decision :"+decision);
        }else if(role == 'mdmadmin'){
            log.info("Test2");
            decision = policy.getDecision(operationName, action, role, "");
        }else{
            log.info("Test3");
            var result = db.query("select * from devices where id ="+deviceId);
            var userId = result[0].user_id;
            user.getUserRoles({'username':userId});
            for(var i = 0;i<roleList.length;i++){
                var decision = policy.getDecision(operationName,action,roleList[i],"");
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
        
        var gpresult = db.query("SELECT policies.content as data FROM policies,group_policy_mapping where policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = 'Role Dilshan'");
        log.info("Policy Payload :"+gpresult[0].data);
        var jsonData = parse(gpresult[0].data);
        sendMessageToIOSDevice({'deviceid':deviceID, 'operation':'POLICY', 'data': jsonData});
    }

	function sendMessageToDevice(ctx){

        var message = stringify(ctx.data);
        var token = Math.random() * 1000000;
        var status = false;
        var device_info = db.query("SELECT reg_id, os_version, platform_id, user_id FROM devices WHERE id = ?", ctx.deviceid+"");
        var userID = device_info[0].user_id;
        var feature = db.query("SELECT * FROM features WHERE name LIKE ?", ctx.operation);
        if(feature==undefined || feature == null || feature[0]== undefined || feature[0] == null ){
            return false;
        }
        var groupID = "-1";
        var string = "0";
        if (device_info[0] != null) {
            string = device_info[0].os_version;
        }
        string = string.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "");
        for (var i = string.length; i < 4; i++) {
            string += "0";
        }
        var platform_feature = db.query("SELECT id, template, min_version FROM platformfeatures WHERE (platform_id = ? AND feature_id = ?)", 
        	device_info[0].platform_id, feature[0].id);
        var stringnew = "0";
        if (platform_feature[0] != null) {
            stringnew = platform_feature[0].min_version;
        }
        stringnew = stringnew.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "");
        for (var i = stringnew.length; i < 4; i++) {
            stringnew += "0";
        }
        var regId = device_info[0].reg_id;
        //  var data = "{}";
        if (platform_feature[0] != null) {
            //     data = platform_feature[0].template;
        }
        var currentdate = new Date();
        var datetime =  currentdate.getDate() + "/"
            + (currentdate.getMonth()+1)  + "/"
            + currentdate.getFullYear() + " @ "
            + currentdate.getHours() + ":"
            + currentdate.getMinutes() + ":"
            + currentdate.getSeconds();

        log.info("Test Function");
        if (parseInt(string) >= parseInt(stringnew)) {
            db.query("INSERT INTO notifications (device_id, group_id, message, status, sent_date, feature_code, user_id ,feature_description) values(?, ?, ?, 'P', ?, ?, ?, ?)", 
            	ctx.deviceid, groupID, message, datetime, feature[0].code, userID,feature[0].description);	
            var lastRecord = db.query("SELECT LAST_INSERT_ID()");
            var lastRecordJson = lastRecord[0];
            log.info(lastRecordJson["LAST_INSERT_ID()"]);
            token = lastRecordJson["LAST_INSERT_ID()"];
            log.info(token);
            var msg = {};
            msg.token = token;
            jsonStringData = stringify(msg.toSource());
            log.info(jsonStringData);
            log.info("Data fromat"+message);
            var gcmMSG = gcm.sendViaGCMtoMobile(regId, feature[0].code, token, message, 3);
            log.info(gcmMSG);
            return true;
        } else {
            return false;
        }
    }
    
    function sendMessageToIOSDevice(ctx){
		log.info("CTX >>>>>"+stringify(ctx));
        var message = stringify(ctx.data);
        var devices = db.query("SELECT reg_id FROM devices WHERE id = ?", ctx.deviceid+"");
        var regId = devices[0].reg_id;
        var regIdJsonObj = parse(regId);

        if(ctx.operation=="CLEARPASSWORD"){
            var unlockToken = regIdJsonObj.unlockToken;
            message = {};
            message.unlock_token = unlockToken;
            message = stringify(message);
            log.info("Messagee"+message);
        }

        var pushMagicToken = regIdJsonObj.magicToken;
        var deviceToken = regIdJsonObj.token;

		log.error("device id : "+ ctx.deviceid);
		log.error("device token : "+ deviceToken);
		log.error("magic token : "+ pushMagicToken);

        var users = db.query("SELECT user_id FROM devices WHERE id = ?", ctx.deviceid+"");
        var userId = users[0].user_id;

        var currentdate = new Date();
        var datetime =  currentdate.getDate() + "/"+ (currentdate.getMonth()+1)  + "/"+ currentdate.getFullYear() + " @ "+ currentdate.getHours() + ":"+ currentdate.getMinutes() + ":"+ currentdate.getSeconds();

        log.info("Test operation"+ctx.operation);

        var features = db.query("SELECT id, code, description FROM features WHERE name LIKE ?", ctx.operation+"");
        var featureCode = features[0].code;
        var featureDescription = features[0].description;

        db.query("INSERT INTO notifications (device_id, group_id, message, status, sent_date, feature_code, user_id, feature_description) values( ?, '1', ?, 'P', ?, ?, ?, ?)", 
        	ctx.deviceid, message, datetime, featureCode, userId, featureDescription);

		common.initAPNS(common.getPushCertPath(), common.getPushCertPassword(), deviceToken, pushMagicToken);

        return true;
    }

    // prototype
    module.prototype = {
        constructor: module,
        isRegistered: function(ctx){
            var result = db.query("SELECT reg_id FROM devices WHERE reg_id = ? && deleted = 0", ctx.regid);
            log.info("IS Registered >>>>>>>>>>"+result[0]);
            var state = (result != null && result != undefined && result[0] != null && result[0] != undefined);
            log.info(state);
            return state;
        },
        register: function(ctx){
            var log = new Log();
			ctx.email = ctx.email+"@carbon.super";
			var tenantUser = carbon.server.tenantUser(ctx.email);
		    var userId = tenantUser.username;
			var tenantId = tenantUser.tenantId;
			
            var platforms = db.query("SELECT id FROM platforms WHERE name = ?", ctx.platform);
            var platformId = platforms[0].id;

            var currentdate = new Date();
            var createdDate =  currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/"
                + currentdate.getFullYear() + " @ "
                + currentdate.getHours() + ":"
                + currentdate.getMinutes() + ":"
                + currentdate.getSeconds();

            if(ctx.regid!=null){
                var result = db.query("SELECT * FROM devices WHERE reg_id= ?", ctx.regid);
                if(result[0]==null){
                    db.query("INSERT INTO devices (tenant_id, os_version, created_date, properties, reg_id, status, deleted, user_id, platform_id, vendor, udid) VALUES(?, ?, ?, ?, ?,'A','0', ?, ?, ?,'0');", tenantId, ctx.osversion, createdDate, ctx.properties, ctx.regid, userId, platformId, ctx.vendor);
                    var devices = db.query("SELECT * FROM devices WHERE reg_id = ?", ctx.regid);
                    var platform = '';
                    if(devices[0].platform_id == 1){
                        platform = 'android';
                    }else if(devices[0].platform_id == 2){
                        platform = 'ios';
                    }
                    
                    var deviceID = "" + devices[0].id;
                    sendMessageToDevice({'deviceid':deviceID, 'operation': "INFO", 'data': "hi"});
                    sendMessageToDevice({'deviceid':deviceID, 'operation': "APPLIST", 'data': "hi"});
                    sendMessageToDevice({'deviceid':deviceID, 'operation': "DATAUSAGE", 'data': "hi"});

                    var upresult = db.query("SELECT policies.content as data, policies.type FROM policies, user_policy_mapping where policies.id = user_policy_mapping.policy_id && user_policy_mapping.user_id = ?",stringify(userId));
                    if(upresult!=undefined && upresult != null && upresult[0] != undefined && upresult[0] != null ){
                        log.info("Policy Payload :"+gpresult[0].data);
                        var jsonData = parse(gpresult[0].data);
                        jsonData = policyByOsType(jsonData,'android');
                        sendMessageToDevice({'deviceid':deviceID, 'operation': "POLICY", 'data': jsonData});
                        return true;
                    }

                    var ppresult = db.query("SELECT policies.content as data, policies.type FROM policies,platform_policy_mapping where policies.id = platform_policy_mapping.policy_id && platform_policy_mapping.platform_id = ?",platform);
                    log.info(ppresult[0]);
                    if(ppresult!=undefined && ppresult != null && ppresult[0] != undefined && ppresult[0] != null ){
                        log.info("Policy Payload :"+ppresult[0].data);
                        var jsonData = parse(ppresult[0].data);
                        jsonData = policyByOsType(jsonData,'android');
                        sendMessageToDevice({'deviceid':deviceID, 'operation': "POLICY", 'data': jsonData});
                        return true;
                    }
                    var roleList = user.getUserRoles({'username':userId});
                    var removeRoles = new Array("Internal/everyone", "portal", "wso2.anonymous.role", "reviewer","private_kasun:wso2mobile.com");
                    var roles = common.removeNecessaryElements(roleList,removeRoles);
                    var role = roles[0];
                    var gpresult = db.query("SELECT policies.content as data, policies.type FROM policies,group_policy_mapping where policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",role+'');
                    log.info(gpresult[0]);
                    if(gpresult != undefined && gpresult != null && gpresult[0] != undefined && gpresult[0] != null){
                        log.info("Policy Payload :"+gpresult[0].data);
                        var jsonData = parse(gpresult[0].data);
                        jsonData = policyByOsType(jsonData,'android');
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
            var tenantUser = carbon.server.tenantUser(ctx.email+"@carbon.super");
		    var userId = tenantUser.username;
			var tenantId = tenantUser.tenantId;
			
            var platforms = db.query("SELECT id FROM platforms WHERE name = ?", ctx.platform);
            var platformId = platforms[0].id;

            var currentdate = new Date();
            var createdDate =  currentdate.getDate() + "/"+ (currentdate.getMonth()+1)  + "/"+ currentdate.getFullYear() + " @ "+ currentdate.getHours() + ":"+ currentdate.getMinutes() + ":"+ currentdate.getSeconds();

            var devicesCheckUDID = db.query("SELECT * FROM devices WHERE udid = ?", ctx.udid);
            if(devicesCheckUDID != undefined && devicesCheckUDID != null && devicesCheckUDID[0] != undefined && devicesCheckUDID[0] != null){
                db.query("Update devices SET reg_id = ? WHERE udid = ?", ctx.regid, ctx.udid);
            }else{
                db.query("INSERT INTO devices (tenant_id, os_version, created_date, properties, reg_id, status, deleted, user_id, platform_id, vendor, udid) VALUES(?, ?, ?, ?, ?, 'A', '0', ?, ?, ?, ?)", 
                	tenantId, ctx.osversion, createdDate, ctx.properties, ctx.regid, userId, platformId, ctx.vendor, ctx.udid);
            }

            return true;
        },
        sendToDevice: function(ctx){
            var devices = db.query("SELECT platform_id FROM devices WHERE id = ?", ctx.deviceid+"");
            var platformID = devices[0].platform_id;
            if(platformID==1){
                return sendMessageToDevice(ctx);
            }else{
                log.info("platformID"+platformID);
               // return sendMessageToDevice(ctx);
                return sendMessageToIOSDevice(ctx);
            }
        },
        sendToDevices:function(ctx){
            log.info("test sendToDevices");
            log.info(ctx.devices[0]);
           var devices =  ctx.devices;
           for(var i=0;i<devices.length;i++){
                this.sendToDevice({'deviceid':devices[i],'operation':ctx.operation});
           }
        },
        getPendingOperationsFromDevice: function(ctx){
			
            var deviceList = db.query("SELECT id FROM devices WHERE udid = " + ctx.udid);
            
            if(deviceList[0]!=null){
                var deviceID = String(deviceList[0].id);
                var pendingFeatureCodeList=db.query("SELECT feature_code ,message, id, received_data FROM notifications WHERE notifications.status='P' AND notifications.device_id = ?", deviceID+"");
                
                if(pendingFeatureCodeList!=undefined && pendingFeatureCodeList != null && pendingFeatureCodeList[0]!= undefined && pendingFeatureCodeList[0]!= null){
                    var id = pendingFeatureCodeList[0].id;
                    var feature_code = pendingFeatureCodeList[0].feature_code;
                    log.error("feature_code >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> " + feature_code);
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
                log.error(properties);
                var properties = parse(result[0].properties);

                var platform = "" + properties["PRODUCT"];
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
            var featureList = db.query("SELECT DISTINCT features.description, features.id, features.name, features.code, platformfeatures.template FROM devices, platformfeatures, features WHERE devices.platform_id = platformfeatures.platform_id AND devices.id = ? AND features.id = platformfeatures.feature_id", stringify(deviceId));
			
            var obj = new Array();
            for(var i=0; i<featureList.length; i++){
                var featureArr = {};
                var ftype = db.query("SELECT featuretype.name FROM featuretype, features WHERE features.type_id=featuretype.id AND features.id= ?", stringify(featureList[i].id));

                featureArr["name"] = featureList[i].name;
                featureArr["feature_code"] = featureList[i].code;
                featureArr["feature_type"] = ftype[0].name;
                featureArr["description"] = featureList[i].description;
                //featureArr["enable"] = checkPermission(role,deviceId, featureList[i].name, this);
                featureArr["enable"] = true;
                if(featureList[i].template === null || featureList[i].template === ""){

                }else{
                    featureArr["template"] = featureList[i].template;
                }
                obj.push(featureArr);
            }

         //   log.info(obj);

            return obj;
        },
        unRegister:function(ctx){
            if(ctx.regid!=null){
                var result = db.query("Delete from devices where reg_id= ?", ctx.regid);
                if(result=1){
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
            log.info(roleList[0]);
            var gpresult = db.query("SELECT policies.content as data FROM policies,group_policy_mapping where policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",roleList[0]);
            log.info(gpresult[0]);
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
            try{
                setInterval(this.monitor(ctx),100000);
            }catch (e){
                log.info("Error In Monitoring");
            }

        },
        monitor:function(ctx){
                var result = db.query("SELECT * from devices");
                for(var i=0; i<result.length; i++){

                    var deviceId = result[i].id;
                    log.info("Device ID :"+deviceId);
                    var platform = '';
                    if(result[0].platform_id == 1){
                        platform = 'android';
                    }else if(result[0].platform_id == 2){
                        platform = 'ios';
                    }
                    var operation = 'MONITORING';
                    var data = {};
                    var userId = result[i].user_id;
                    this.sendToDevice({'deviceid':deviceId,'operation':'INFO','data':{}});
                    this.sendToDevice({'deviceid':deviceId,'operation':'APPLIST','data':{}});
                    log.info("Test1");
                    var upresult = db.query("SELECT policies.content as data, policies.type FROM policies, user_policy_mapping where policies.id = user_policy_mapping.policy_id && user_policy_mapping.user_id = ?",stringify(userId));
                    if(upresult!=undefined && upresult != null && upresult[0] != undefined && upresult[0] != null ){
                        log.info("Policy Payload :"+gpresult[0].data);
                        var jsonData = parse(gpresult[0].data);
                        jsonData = policyByOsType(jsonData,'android');
                        this.sendToDevice({'deviceid':deviceId,'operation':operation,'data':jsonData});
                        continue;
                    }

                    var ppresult = db.query("SELECT policies.content as data, policies.type FROM policies,platform_policy_mapping where policies.id = platform_policy_mapping.policy_id && platform_policy_mapping.platform_id = ?",platform);
                    if(ppresult!=undefined && ppresult != null && ppresult[0] != undefined && ppresult[0] != null ){
                        log.info("Policy Payload :"+ppresult[0].data);
                        var jsonData = parse(ppresult[0].data);
                        jsonData = policyByOsType(jsonData,'android');
                        this.sendToDevice({'deviceid':deviceId,'operation':operation,'data':jsonData});
                        continue;
                    }


                    var roleList = user.getUserRoles({'username':userId});
                    var removeRoles = new Array("Internal/everyone", "portal", "wso2.anonymous.role", "reviewer","private_kasun:wso2mobile.com");
                    var roles = common.removeNecessaryElements(roleList,removeRoles);
                    var role = roles[0];
                    log.info("Roleeeee"+role);
                    var gpresult = db.query("SELECT policies.content as data, policies.type FROM policies,group_policy_mapping where policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",role+'');
                    log.info("Resulttttttttttt"+gpresult[0]);
                    if(gpresult != undefined && gpresult != null && gpresult[0] != undefined && gpresult[0] != null){
                        log.info("Policy Payload :"+gpresult[0].data);
                        var jsonData = parse(gpresult[0].data);
                        jsonData = policyByOsType(jsonData,'android');
                        this.sendToDevice({'deviceid':deviceId,'operation':operation,'data':jsonData});
                    }

                }
        }
    };

    return module;
})();



