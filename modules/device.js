var device = (function () {
    var configs = {
        CONTEXT: "/"
    };

    var carbon = require('carbon');
	var server = new carbon.server.Server(configs.HTTPS_URL + '/admin');


    var log = new Log();
    var gcm = require('gcm').gcm;

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
    function checkPermission(deviceId,operationName){

        var policy = require('policy');
        log.info(policy.policy.init());

        var result = db.query("select * from devices where id ="+deviceId);
        var userId = result[0].user_id;
        var roleList = parse(user.getUserRoles({'username':userId}));

      //  log.info("Role List >>>>>>>>"+roleList[0]);

        for(var i = 0;i<roleList.length;i++){
            var resource = roleList[i]+"/"+operationName;
            var action = 'POST';
            var subject = 'Admin';
            log.info("Resource >>>>>>>"+resource);
            log.info("Resource >>>>>>>"+action);
            log.info("Resource >>>>>>>"+subject);
            var decision = policy.policy.getDecision(resource,action,subject,"");
            log.info("Test Decision >>>>>>>>>>>>>>"+decision);
            if(decision=="Permit"){
                break;
            }
        }


        if(decision=="Permit"){
            return true;

        }else{
            return false;
        }

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
            var unlockToken = regIdJsonObj.unlock_token;
            message = {};
            message.unlock_token = unlockToken;
            message = stringify(message);
            log.info("Messagee"+message);
        }

        var pushMagicToken = regIdJsonObj.push_magic_token;
        var deviceToken = regIdJsonObj.device_token;

        log.info(pushMagicToken);
        log.info(deviceToken);

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

        var url = "http://192.168.43.177:8444/push";
        var data = {"push_magic_token":pushMagicToken,"device_token":deviceToken};
        var ruby = get(url, data ,"text");
        log.info(ruby);

        return true;
    }

    // prototype
    module.prototype = {
        constructor: module,
        isRegistered: function(ctx){
            var result = db.query("SELECT reg_id FROM devices WHERE reg_id = ? && deleted = 0", ctx.regid);
            return (result != null && result != undefined && result[0] != null && result[0] != undefined);
        },
        register: function(ctx){
            var log = new Log();
            
            var um = new carbon.user.UserManager(server, server.getTenantDomain(ctx.email));
		    var userId = server.getTenantAwareUsername(ctx.email);
			var tenantId = server.getTenantIdByDomain(server.getTenantDomain(ctx.email));
			
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
                    sendMessageToDevice({'deviceid':deviceID, 'operation': "TRACKCALLS", 'data': "hi"});
                    sendMessageToDevice({'deviceid':deviceID, 'operation': "DATAUSAGE", 'data': "hi"});
                    var roles = this.getUserRoles({'username':userId});
                    var roleList = parse(roles);
                    log.info(roleList[0]);
                    var gpresult = db.query("SELECT policies.content as data FROM policies,group_policy_mapping where policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",roleList[0]);
                    var jsonData = parse(gpresult[0].data);
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
            
            var um = new carbon.user.UserManager(server, server.getTenantDomain(ctx.email));
		    var userId = server.getTenantAwareUsername(ctx.email);
			var tenantId = server.getTenantIdByDomain(server.getTenantDomain(ctx.email));
			
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

            var devices = db.query("SELECT * FROM devices WHERE udid = ?", ctx.udid);
            var deviceID = devices[0].id;

            sendMessageToIOSDevice({'deviceid':deviceID, 'operation': "INFO", 'data': "hi"});
            sendMessageToIOSDevice({'deviceid':deviceID, 'operation': "APPLIST", 'data': "hi"});

            return true;
        },
        sendToDevice: function(ctx){
            log.info("Test Device ID"+ctx.deviceid);
            var devices = db.query("SELECT platform_id FROM devices WHERE id = ?", ctx.deviceid+"");
            var platformID = devices[0].platform_id;
            if(platformID==1){
                return sendMessageToDevice(ctx);
            }else{
                return sendMessageToIOSDevice(ctx);
            }
        },
        getPendingOperationsFromDevice: function(ctx){
			
            var deviceList = db.query("SELECT id FROM devices WHERE udid = ?", ctx.udid);
            if(deviceList[0]!=null){
                var deviceID = String(deviceList[0].id);
                var pendingFeatureCodeList=db.query("SELECT feature_code ,message ,id FROM notifications WHERE notifications.status='P' AND notifications.device_id = ?", deviceID+"");
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
            var result = db.query("SELECT properties FROM devices WHERE device_id= ?", ctx.deviceid);

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

                var updateResult = db.query("UPDATE devices SET properties = ?, reg_id = ? WHERE device_id = ?", 
                	stringify(properties), stringify(tokenProperties), devicesId);

                if(updateResult != null && updateResult != undefined && updateResult[0] != null
                    && updateResult[0] != undefined) {
                    return true;
                }
            }

            return false;
        },
        getFeaturesFromDevice: function(ctx){
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
                featureArr["enable"] = checkPermission(deviceId, featureList[i].name);
                if(featureList[i].template === null || featureList[i].template === ""){

                }else{
                    featureArr["template"] = featureList[i].template;
                }
                obj.push(featureArr);
            }

            log.info(obj);

            return obj;
        },
        getUserRoles: function(ctx){

            var tenantAwareUsername = server.getTenantAwareUsername(ctx.username);
            log.info(tenantAwareUsername);
            var um = new carbon.user.UserManager(server, server.getTenantDomain(ctx.username));
            var user = um.getUser(tenantAwareUsername);

            return stringify(user.getRoles());
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



