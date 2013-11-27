var isInvalid = function(value){
	return value != undefined && value != null && value != '';
}

var device = function(){
	var userModule = require('user.js').user;
    var user = '';
    var groupModule = require('group.js').group;
    var group = '';
    var db;
	
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

    var invokeInitialFunctions = function(deviceid) {	
		var devices = db.query("SELECT * FROM devices WHERE udid = " + stringify());
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

    var versionComparison = function(osVersion,platformId,featureId){
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
    var  checkPendingOperations = function() {
    	
    	var pendingOperations = db.query("SELECT id, device_id FROM notifications WHERE status = 'P' AND device_id IN (SELECT id FROM devices WHERE platform_id IN (SELECT id FROM platforms WHERE type_name = 'iOS')) ORDER BY sent_date DESC;");
    	
    	for(var i = 0; i < pendingOperations.length; i++) {
    		
    		var deviceId = pendingOperations[i].device_id;
    		var devices = db.query("SELECT reg_id FROM devices WHERE id = ?", deviceId);

    		if(devices != null && devices[0] != null && devices != undefined && devices[0] != undefined) {
    			var regId = devices[0].reg_id;
		    	var regIdJsonObj = parse(regId);
		    	var pushMagicToken = regIdJsonObj.magicToken;
		        var deviceToken = regIdJsonObj.token;
                log.debug("checkPendingOperations >>>>>>>> common.initAPNS");
		    	try {
		    	    common.initAPNS(deviceToken, pushMagicToken);
                } catch (e) {
                    log.error(e);
                    return;
                }
    		}
    	}
    }
    var policyFiltering = function(deviceid, operation, data) {
        //This function is used to filter policy based on the platform
        log.debug("policyFiltering >>>>>"+stringify(arguments));

        var device_id = String(deviceid, );
        var deviceFeature;
        var messageArray
        var i = 0;

        //if (ctx.operation == "POLICY" || ctx.operation == 'MONITORING') {
            //Filter and remove Policies which are not valid for platform
            log.debug(operation);
            messageArray = parse(stringify(data));
            log.debug("Policy codes before: " + messageArray.length);
            while (i < messageArray.length) {
                log.debug("Policy code: " + messageArray[i].code);
                deviceFeature = db.query("SELECT count(*) as count FROM platformfeatures JOIN devices ON platformfeatures.platform_id = devices.platform_id JOIN features ON platformfeatures.feature_id = features.id WHERE devices.id = ? AND features.code = ?", device_id, messageArray[i].code + "");
                log.debug("Device Feature: " + deviceFeature[0].count);
                if (deviceFeature[0].count == 0) {
                    //feature not available for the platform
                    messageArray.splice(i,1);
                } else {
                    ++i;
                }
            }
            log.debug("Policy codes: " + messageArray.length);
            return messageArray;
        //}
        //return null;
    }
    var isRegistered = function(regid, uuid){
	    if(isInvalid(arguments.regid)){
	        var result = db.query("SELECT reg_id FROM devices WHERE reg_id = ? && deleted = 0", arguments.regid);
	        var state = (result != null && result != undefined && result[0] != null && result[0] != undefined);
	        return state;
	    }else if(isInvalid(arguments.uuid)){
	        var result = db.query("SELECT udid FROM devices WHERE udid = ? && deleted = 0", arguments.uuid);
	        var state = (result != null && result != undefined && result[0] != null && result[0] != undefined);
	        return state;
	    }
    }
    var getAppPolicyData = function(userId, platformId, role ){
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
    }
    var getPendingOperationsFromDevice = function(udid){
        var deviceList = db.query("SELECT id FROM devices WHERE udid = " + udid);
        
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
    }
    var getFeaturesFromDevice = function(role, deviceid){
        var role = role;
   	    var deviceId =  deviceid;
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
    var sendMsgToUserDevices = function(userid, data, operation){
        var device_list = db.query("SELECT id, reg_id, os_version, platform_id FROM devices WHERE user_id = ?", userid);
        var succeeded="";
        var failed="";
        for(var i=0; i<device_list.length; i++){
            var status = this.sendToDevice({'deviceid':device_list[i].id, 'operation': operation, 'data' : data});
            if(status == true){
                succeeded += device_list[i].id+",";
            }else{
                failed += device_list[i].id+",";
            }
        }
        return "Succeeded : "+succeeded+", Failed : "+failed;
    }
    var sendMsgToGroupDevices = function(operation, data){
        var succeeded="";
        var failed="";

        var userList = group.getUsersOfGroup();

        for(var i = 0; i < userList.length; i++) {

            var objUser = {};

            var result = db.query("SELECT id FROM devices WHERE user_id = ? AND tenant_id = ?", String(userList[i].email), common.getTenantID());

            for(var j = 0; j < result.length; j++) {

                var status = this.sendToDevice({'deviceid':result[i].id, 'operation': operation, 'data' : data});
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
    }
    var enforcePolicy = function(id){
        var result = db.query("SELECT * from devices where id = ?",id);
        var userId = result[0].user_id;
        var roles = this.getUserRoles({'username':userId});
        var roleList = parse(roles);
        log.debug(roleList[0]);
        var gpresult = db.query("SELECT policies.content as data FROM policies,group_policy_mapping where policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",roleList[0]);
        log.debug(gpresult[0]);
        sendMessageToDevice({'deviceid':deviceID, 'operation': "POLICY", 'data': gpresult[0].data});
    }
    var changeDeviceState = function(deviceId,state){
        db.query("UPDATE devices SET status = ? WHERE id = ?", state, stringify(deviceId));
    }
	var updateDeviceProperties = function(deviceId, osVersion, deviceName) {
                    	
        var deviceResult = db.query("SELECT properties FROM devices WHERE id = ?", deviceId + "");
    	var properties = deviceResult[0].properties;
    	properties = parse(parse(stringify(properties)));
    	properties["device"] = deviceName;
    	
        db.query("UPDATE devices SET os_version = ?, properties = ? WHERE id = ?", osVersion, stringify(properties), deviceId + "");
    }
    var getCurrentDeviceState = function(deviceId){
        var result = db.query("select status from devices where id = ?",stringify(deviceId));
        if(result != undefined && result != null && result[0] != undefined && result[0] != null){
            return result[0].status;
        }else{
            return null;
        }
    }
}
device.prototype.constructor = function (dbs) {
    db = dbs;
    user = new userModule(db);
    group = new groupModule(db);
}