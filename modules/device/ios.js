var device = require('device.js').device;

var iosDevice = function(){
	var sendMessageToDevice = function(data, deviceid, operation){
        var message = stringify(data);

        //Filter the policy depending on Device
        if (operation == 'MONITORING') {
            log.debug("Message >>>>>> " + message);
            var filterMessage = policyFiltering({'deviceid': deviceid, 'operation':operation, 'data': data.policies});
            if (filterMessage != null) {
                log.debug("MONITORING");
                log.debug("Old Message >>>>> " + message);
                data.policies = filterMessage;
                message = stringify(data);
                log.debug("New Message >>>>> " + message);
            }
        } else if (operation == "POLICY") {
            var filterMessage = policyFiltering({'deviceid': deviceid, 'operation':operation, 'data': data});
            if (filterMessage != null) {
                log.debug("POLICY");
                log.debug("Old Message >>>>> " + message);
                log.debug("New Message >>>>> " + stringify(filterMessage));
                message = stringify(filterMessage);
            }
        }


        var devices = db.query("SELECT reg_id FROM devices WHERE id = ?", deviceid+"");
        if(devices == null || devices == undefined || devices[0] == null || devices[0] == undefined) {
        	return;
        }
        
        var regId = devices[0].reg_id;
        var regIdJsonObj = parse(regId);

        if(operation=="CLEARPASSWORD"){
            var unlockToken = regIdJsonObj.unlockToken;
            message = {};
            message.unlock_token = unlockToken;
            message = stringify(message);
            log.debug("Messagee"+message);
        }

        var pushMagicToken = regIdJsonObj.magicToken;
        var deviceToken = regIdJsonObj.token;

		log.error("device id : "+ deviceid);
		log.error("device token : "+ deviceToken);
		log.error("magic token : "+ pushMagicToken);

        var users = db.query("SELECT user_id FROM devices WHERE id = ?", deviceid+"");
        var userId = users[0].user_id;


        var datetime =  common.getCurrentDateTime();

        log.error("Test operation"+operation);

        var features = db.query("SELECT id, code, description FROM features WHERE name LIKE ?", operation+"");
        
        if(features == null || features == undefined || features[0] == null || features[0] == undefined) {
        	return false;
        }
        
        var featureCode = features[0].code;
        var featureDescription = features[0].description;
        if(featureCode == "501P"){
            try{
                log.info("Test2");
                db.query("DELETE FROM notifications WHERE device_id = ? AND status='P' AND feature_code = ?",deviceid,featureCode);
                log.info("Test3");
            }catch (e){
                log.info(e);
            }
        }
        db.query("INSERT INTO notifications (device_id, group_id, message, status, sent_date, feature_code, user_id, feature_description) values( ?, '1', ?, 'P', ?, ?, ?, ?)", 
        	deviceid, message, datetime, featureCode, userId, featureDescription);

        log.debug("sendMessageToIOSDevice >>>>>>>> common.initAPNS");

        try {
		    common.initAPNS(deviceToken, pushMagicToken);
        } catch (e) {
            log.error(e);
        }

        return true;
    }
    var register = function(email,platform, udid, regid, udid, vendor, properties){
        var tenantUser = carbon.server.tenantUser(email);
	    var userId = tenantUser.username;
		var tenantId = tenantUser.tenantId;
		
        var platforms = db.query("SELECT id FROM platforms WHERE name = ?", platform);
        var platformId = platforms[0].id;

        var createdDate = common.getCurrentDateTime();
        var devicesCheckUDID = db.query("SELECT * FROM devices WHERE udid = ?", udid);
        if(devicesCheckUDID != undefined && devicesCheckUDID != null && devicesCheckUDID[0] != undefined && devicesCheckUDID[0] != null){
            db.query("Update devices SET reg_id = ? WHERE udid = ?", regid, udid);
        }else{
            db.query("INSERT INTO devices (tenant_id, os_version, created_date, properties, reg_id, status, deleted, user_id, platform_id, vendor, udid) VALUES(?, ?, ?, ?, ?, 'A', '0', ?, ?, ?, ?)", 
            	tenantId, ctx.osversion, createdDate, stringify(properties), regid, userId, platformId, vendor, udid);
        }

        return true;
    }
    var updateiOSTokens = function(deviceid, token, unlockToken, magicToken){
			var result = db.query("SELECT properties FROM devices WHERE udid = " + stringify(deviceid));
            
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
                tokenProperties["token"] = token;
                tokenProperties["unlockToken"] = unlockToken;
                tokenProperties["magicToken"] = magicToken;

                var updateResult = db.query("UPDATE devices SET properties = ?, reg_id = ? WHERE udid = ?", 
                	stringify(properties), stringify(tokenProperties), deviceid);

                if(updateResult != null && updateResult != undefined && updateResult == 1) {
                    	
					setTimeout(function(){invokeInitialFunctions(deviceid)}, 2000);
                    	
                    return true;
                }
            }

            return false;
        }
}

iosDevice.prototype = new device();