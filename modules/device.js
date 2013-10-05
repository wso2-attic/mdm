var TENANT_CONFIGS = 'tenant.configs';
var USER_MANAGER = 'user.manager';
var common = require("/modules/common.js");

var device = (function () {
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
    function checkPermission(role, deviceId, operationName, that){

        log.info("Device >>>"+deviceId);
        log.info("Operation >>>"+operationName);

        var policy = require('policy');
        log.info(policy.policy.init());

        var decision = null;
        var action = 'POST';
        if(role == 'admin'){
            decision = policy.policy.getDecision(operationName, action, role, "");
            log.info("Test Decision1 >>>>>>>>>>>>>>"+decision);
        }else if(role == 'mdmadmin'){
           decision = policy.policy.getDecision(operationName, action, role, "");
            log.info("Test Decision2 >>>>>>>>>>>>>>"+decision);
        }else{
            var result = db.query("select * from devices where id ="+deviceId);
            var userId = result[0].user_id;
            log.info("Test1");
            log.info("Role List1 >>>"+that.getUserRoles({'username':userId}));
            log.info("Test2");
            var roleList = parse(that.getUserRoles({'username':userId}));
            log.info("Role List2 >>>"+roleList);
            for(var i = 0;i<roleList.length;i++){
                var decision = policy.policy.getDecision(operationName,action,roleList[i],"");
                log.info("Test Decision3 >>>>>>>>>>>>>>"+decision);
                if(decision=="Permit"){
                    break;
                }
            }
            log.info("Test Decision3 >>>>>>>>>>>>>>"+decision);
        }
        /*var roleList = parse(that.getUserRoles({'username':userId}));
        for(var i = 0;i<roleList.length;i++){
            var resource = roleList[i]+"/"+operationName;
            var action = 'POST';
            var subject = 'Admin';
            log.info("Resource >>>>>>>"+resource);
            log.info("Action >>>>>>>"+action);
            log.info("Subject >>>>>>>"+subject);
            var decision = policy.policy.getDecision(resource,action,subject,"");
            log.info("Test Decision >>>>>>>>>>>>>>"+decision);
            if(decision=="Permit"){
                break;
            }
        }*/

        if(decision=="Permit"){
            return true;

        }else{
            return false;
        }

    }
    
	function invokeInitialFunctions(ctx) {
		
		var devices = db.query("SELECT * FROM devices WHERE udid = " + stringify(ctx.deviceid));
        var deviceID = devices[0].id;

        sendMessageToIOSDevice({'deviceid':deviceID, 'operation': "INFO", 'data': "hi"});
        sendMessageToIOSDevice({'deviceid':deviceID, 'operation': "APPLIST", 'data': "hi"});

		/**
        var roles = this.getUserRoles({'userid':userId});
        var roleList = parse(roles);
        log.info(roleList[0]);
        var gpresult = db.query("SELECT policies.content as data FROM policies,group_policy_mapping where policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",roleList[0]);
        log.info("Policy Payload :"+gpresult[0].data);
        var jsonData = parse(gpresult[0].data);
        for(var i =0 ;i < jsonData.length; i++){
            var code = jsonData[i].code;
            var result = db.query("select name from features where code = ? ",code);
            var featureName = result[0].name;
            var data = jsonData[i].data;
            sendMessageToIOSDevice({'deviceid':deviceID, 'operation':featureName, 'data': data});
        }*/
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
		//log.info("CTX >>>>>"+stringify(ctx));
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

        db.query("UPDATE notifications SET status='D' where device_id = ? && feature_code = ? && status = 'P'", ctx.deviceid+"", featureCode);
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
                    
                    var deviceID = "" + devices[0].id;
                    sendMessageToDevice({'deviceid':deviceID, 'operation': "INFO", 'data': "hi"});
                    sendMessageToDevice({'deviceid':deviceID, 'operation': "APPLIST", 'data': "hi"});
                 //   sendMessageToDevice({'deviceid':deviceID, 'operation': "TRACKCALLS", 'data': "hi"});
                    sendMessageToDevice({'deviceid':deviceID, 'operation': "DATAUSAGE", 'data': "hi"});
                    var roles = this.getUserRoles({'username':userId});
                    var roleList = parse(roles);
                    log.info(roleList[0]);
                    var gpresult = db.query("SELECT policies.content as data, policies.type FROM policies,group_policy_mapping where policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",roleList[0]);
                    log.info("Policy Payload :"+gpresult[0].data);
                    var jsonData = parse(gpresult[0].data);
                    jsonData = this.policyByOsType(jsonData,'android');
                    sendMessageToDevice({'deviceid':deviceID, 'operation': "POLICY", 'data': jsonData});
                    return true;
                }else{
                    db.query("UPDATE devices SET deleted = 0 WHERE reg_id = ?", ctx.regid);
                    return true;
                }
            }else{
                return false;
            }
        },
        registerIOS: function(ctx){
            var tenantUser = carbon.server.tenantUser(ctx.email);
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
                log.info("platformID"+platformID);
                return sendMessageToDevice(ctx);
            }else{
                log.info("platformID"+platformID);
                return sendMessageToIOSDevice(ctx);
            }
        },
        getPendingOperationsFromDevice: function(ctx){
			
            var deviceList = db.query("SELECT id FROM devices WHERE udid = " + ctx.udid);
            if(deviceList[0]!=null){
                var deviceID = String(deviceList[0].id);
                var pendingFeatureCodeList=db.query("SELECT feature_code ,message, id FROM notifications WHERE notifications.status='P' AND notifications.device_id = ?", deviceID+"");
                if(pendingFeatureCodeList!=undefined && pendingFeatureCodeList != null && pendingFeatureCodeList[0]!= undefined && pendingFeatureCodeList[0]!= null){
                    var id =  pendingFeatureCodeList[0].id;
                    db.query("UPDATE notifications SET status='C' where id = ?", id+"");
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
        getUserRoles: function(ctx){

            var tenantUser = carbon.server.tenantUser(ctx.username);
            log.info("Tenant ID"+tenantUser.tenantId);
            log.info("Tenant Username"+tenantUser.username);

			var um = userManager(tenantUser.tenantId);
            log.info("getUser");
		    var user = um.getUser(tenantUser.username);

            log.info("User"+stringify(user));

            var tempRoles = user.getRoles();
            var roles = new Array();

            for(var i = 0; i<tempRoles.length; i++){
                if(tempRoles[i].substring(0,8) == 'private_'){
                    continue;
                }else{
                    roles.push(tempRoles[i]);
                }
            }
            return stringify(roles);
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
        }
    };
    // return module
    return module;
})();



