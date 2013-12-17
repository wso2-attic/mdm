var device = require('device.js').device;

var androidDevice = function(){
	var sendMessageToDevice = function(data, deviceid, operation){
        var payLoad = stringify(data);
        var deviceId = deviceid;
        var operationName = operation; 

        var devices = db.query("SELECT reg_id, os_version, platform_id, user_id FROM devices WHERE id = ?", deviceId+"");
        if(devices == undefined || devices == null || devices[0]== undefined || devices[0] == null ){
            return false;
        }
        var userID = devices[0].user_id;
        var osVersion = devices[0].os_version;
        var platformId = devices[0].platform_id;
        var regId = devices[0].reg_id;

        var features = db.query("SELECT * FROM features WHERE name LIKE ?", operation);
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
        if(featureCode == "501P"){
            try{
                db.query("DELETE FROM notifications WHERE device_id = ? AND status='P' AND feature_code = ?",deviceId,featureCode);
            }catch (e){
                log.info(e);
            }
        }
        var currentDate = common.getCurrentDateTime();
        db.query("INSERT INTO notifications (device_id, group_id, message, status, sent_date, feature_code, user_id ,feature_description) values(?, ?, ?, 'P', ?, ?, ?, ?)", deviceId, -1, payLoad, currentDate, featureCode, userID,featureDescription);
        var lastRecord = db.query("SELECT LAST_INSERT_ID()");
        var lastRecordJson = lastRecord[0];
        var token = lastRecordJson["LAST_INSERT_ID()"];
        var gcmMSG = gcm.sendViaGCMtoMobile(regId, featureCode, token, payLoad, 3);
        log.debug(gcmMSG);
        return true;
    }
    var register = function(email,vendor,regid,properties,osversion,platform){
        var log = new Log();
		email = email+"@carbon.super";
		var tenantUser = carbon.server.tenantUser(email);
	    var userId = tenantUser.username;
		var tenantId = tenantUser.tenantId;
		
        var platforms = db.query("SELECT id FROM platforms WHERE name = ?", platform);//from device platform comes as iOS and Android then convert into platform id to save in device table
        var platformId = platforms[0].id;

        var createdDate =  common.getCurrentDateTime();

        if(regid!=null){
            var result = db.query("SELECT * FROM devices WHERE reg_id= ?", regid);

            if(result[0]==null){

                var roleList = user.getUserRoles({'username':userId});
                var removeRoles = new Array("Internal/everyone", "portal", "wso2.anonymous.role", "reviewer","private_kasun:wso2mobile.com");
                var roles = common.removeNecessaryElements(roleList,removeRoles);
                var role = roles[0];

                db.query("INSERT INTO devices (tenant_id, os_version, created_date, properties, reg_id, status, deleted, user_id, platform_id, vendor, udid) VALUES(?, ?, ?, ?, ?,'A','0', ?, ?, ?,'0');", tenantId, osversion, createdDate, properties, regid, userId, platformId, vendor);
                var devices = db.query("SELECT * FROM devices WHERE reg_id = ?", regid);

                
                var deviceID = "" + devices[0].id;
                sendMessageToDevice({'deviceid':deviceID, 'operation': "debug", 'data': "hi"});
                sendMessageToDevice({'deviceid':deviceID, 'operation': "APPLIST", 'data': "hi"});
                sendMessageToDevice({'deviceid':deviceID, 'operation': "DATAUSAGE", 'data': "hi"});

                var appPolicyData = this.getAppPolicyData(userId, platform,role);
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

                var ppresult = db.query("SELECT policies.content as data, policies.type FROM policies,platform_policy_mapping where category = 1 && policies.id = platform_policy_mapping.policy_id && platform_policy_mapping.platform_id = ?",platform);
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
                db.query("UPDATE devices SET deleted = 0 WHERE reg_id = ?", regid);
                return true;
            }
        }else{

        }
    }
    var unregister = function(regid){
            if(regid!=null){
                var result = db.query("Delete from devices where reg_id = ?", regid);
                if(result == 1){
                    return true;
                }else{
                    return false
                }
            }else{
                return false;
            }
        }
}
androidDevice.prototype = new device();
