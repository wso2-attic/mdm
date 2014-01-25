var TENANT_CONFIGS = 'tenant.configs';
var USER_MANAGER = 'user.manager';
var common = require("/modules/common.js");
var configFile = require('/config/mdm.js').config();


var device = (function () {

    var userModule = require('user.js').user;
    var user = '';
    var groupModule = require('group.js').group;
    var group = '';
    var sqlscripts = require('/sqlscripts/mysql.js');
    var tenantID = common.getTenantID();


    var configs = {
        CONTEXT: "/"
    };

    var carbon = require('carbon');
    var server = function(){
        return application.get("SERVER");
    }

    var log = new Log();
    var gcm = require('gcm').gcm;

    /** common functions **/
    var configs = function (tenantId) {
        var config = application.get(TENANT_CONFIGS);
        if (!tenantId) {
            return config;
        }
        return config[tenantId] || (config[tenantId] = {});
    };
    /**
	 * Returns the user manager of the given tenant.
	 * 
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
                // Property in destination object not set; create it and set its
				// value.
                obj1[p] = obj2[p];
            }
        }
        return obj1;
    }
    function getPolicyPayLoad(deviceId,category){

        var devices = db.query(sqlscripts.devices.select1, deviceId);
        if (devices == null) {
            return null;
        } else if (devices[0].user_id == null) {
            return null;
        }

        var username = devices[0].user_id;// username for pull policy payLoad
		var tenantID = devices[0].tenant_id;

        var platforms = db.query(sqlscripts.devices.select5, deviceId);

        var platformName = platforms[0].type_name;// platform name for pull
													// policy payLoad
        var roleList = user.getUserRoles({'username':username});
        var removeRoles = new Array("Internal/everyone", "portal", "wso2.anonymous.role", "reviewer","private_kasun:wso2mobile.com");
        var roles = common.removeNecessaryElements(roleList,removeRoles);
        var role = roles[0];// role name for pull policy payLoad

        var obj = {};

        var upresult = db.query(sqlscripts.policies.select15, category,String(username), tenantID);

        if(upresult!=undefined && upresult != null && upresult[0] != undefined && upresult[0] != null ){
            var policyPayLoad;
            var mdmPolicy = parse(upresult[0].data);
            var mamPolicy = parse(upresult[0].mam_data);
            if (mdmPolicy != null && mdmPolicy[0] != null && mamPolicy.length != 0){
                var newMamPolicy = separateMAMPolicy(mamPolicy);
                policyPayLoad = mdmPolicy.concat(newMamPolicy);
            } else if (mdmPolicy != null && mdmPolicy[0] != null && mamPolicy.length == 0){
                policyPayLoad = mdmPolicy;
            } else if (mdmPolicy == null && mdmPolicy[0] == null && mamPolicy.length != 0){
                var newMamPolicy = separateMAMPolicy(mamPolicy);
                policyPayLoad = newMamPolicy;
            }

            var policyPayLoad = parse(upresult[0].data);
            obj.payLoad = policyPayLoad;
            obj.type = upresult[0].type;
            obj.policypriority = "USERS";
            obj.policyid = upresult[0].policyid;
            return obj;
        }

        var ppresult = db.query(sqlscripts.policies.select2, category,platformName, tenantID );
        log.info(ppresult);
        if(ppresult!=undefined && ppresult != null && ppresult[0] != undefined && ppresult[0] != null ){

            var policyPayLoad;
            var mdmPolicy = parse(ppresult[0].data);
            var mamPolicy = parse(ppresult[0].mam_data);
            if (mdmPolicy != null && mdmPolicy[0] != null && mamPolicy.length != 0){
                var newMamPolicy = separateMAMPolicy(mamPolicy);
                policyPayLoad = mdmPolicy.concat(newMamPolicy);
            } else if (mdmPolicy != null && mdmPolicy[0] != null && mamPolicy.length == 0){
                policyPayLoad = mdmPolicy;
            } else if (mdmPolicy == null && mdmPolicy[0] == null && mamPolicy.length != 0){
                var newMamPolicy = separateMAMPolicy(mamPolicy);
                policyPayLoad = newMamPolicy;
            }
            obj.payLoad = policyPayLoad;
            obj.type = ppresult[0].type;
            obj.policypriority = "PLATFORMS";
            obj.policyid = ppresult[0].policyid;
            return obj;
        }

        var gpresult = db.query(sqlscripts.policies.select3, category,role, tenantID);
        if(gpresult != undefined && gpresult != null && gpresult[0] != undefined && gpresult[0] != null){
            var policyPayLoad;
            var mdmPolicy = parse(gpresult[0].data);
            var mamPolicy = parse(gpresult[0].mam_data);
            if (mdmPolicy != null && mdmPolicy[0] != null && mamPolicy.length != 0){
                var newMamPolicy = separateMAMPolicy(mamPolicy);
                policyPayLoad = mdmPolicy.concat(newMamPolicy);
            } else if (mdmPolicy != null && mdmPolicy[0] != null && mamPolicy.length == 0){
                policyPayLoad = mdmPolicy;
            } else if (mdmPolicy == null && mdmPolicy[0] == null && mamPolicy.length != 0){
                var newMamPolicy = separateMAMPolicy(mamPolicy);
                policyPayLoad = newMamPolicy;
            }
            obj.payLoad = policyPayLoad;
            obj.type = gpresult[0].type;
            obj.policypriority = "ROLES";
            obj.policyid = gpresult[0].policyid;
            return obj;
        }
        return null;
    }

    function separateMAMPolicy() {
        var policyArray = new Array();
        var mamPolicy = arguments[0];
        for (var j = 0; j < mamPolicy.length; ++j) {
            var mamData = mamPolicy[j].data;
            for (var i=0; i<mamData.length; ++i) {
                var newPolicyFormat = {};
                if (mamPolicy[j].code == "509B") {
                    newPolicyFormat.code = "509A";
                } else {
                    newPolicyFormat.code = mamPolicy[j].code;
                }
                newPolicyFormat.data = mamData[i];
                policyArray.push(newPolicyFormat);
            }
        }
        log.info("___");
        log.info(mamPolicy);
        return policyArray;
    }

    function getXMLRequestString(role,action,operationName){
        var xmlRequest = <Request xmlns="urn:oasis:names:tc:xacml:3.0:core:schema:wd-17" CombinedDecision="false" ReturnPolicyIdList="false">
            <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:action">
                <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:action:action-id" IncludeInResult="false">
                    <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">{action}</AttributeValue>
                </Attribute>
            </Attributes>
            <Attributes Category="urn:oasis:names:tc:xacml:1.0:subject-category:access-subject">
                <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:subject:subject-id" IncludeInResult="false">
                    <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">{role}</AttributeValue>
                </Attribute>
            </Attributes>
            <Attributes Category="urn:oasis:names:tc:xacml:3.0:attribute-category:resource">
                <Attribute AttributeId="urn:oasis:names:tc:xacml:1.0:resource:resource-id" IncludeInResult="false">
                    <AttributeValue DataType="http://www.w3.org/2001/XMLSchema#string">{operationName}</AttributeValue>
                </Attribute>
            </Attributes>
        </Request>;
        return xmlRequest;
    }
    var entitlement = null;
    var stub = null;

    function init(){
        entitlement = require('policy').entitlement;
        var samlResponse = session.get("samlresponse");
        var saml = require("/modules/saml.js").saml;
        var backEndCookie = saml.getBackendCookie(samlResponse);
        entitlement.setAuthCookie(backEndCookie);
        stub = entitlement.setEntitlementServiceParameters();
    }
    function checkPermission(role, deviceId, operationName, that){
        var decision = entitlement.evaluatePolicy(getXMLRequestString(role,"POST",operationName),stub);
        decision = decision.toString().substring(28,34);
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
    function versionComparison(osVersion,platformId,featureId){
        var deviceOsVersion = osVersion.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, "");
        for (var i = deviceOsVersion.length; i < 4; i++) {
            deviceOsVersion += "0";
        }
        var platformFeatures = db.query(sqlscripts.platformfeatures.select1, platformId, featureId);
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

    function removeDevicePolicy(ctx) {

        var policyid = ctx.policyid;
        var deviceid = ctx.deviceid;
        var revokepolicyid = ctx.revokepolicyid;
        var tenantID = common.getTenantID();
        var policytype = ctx.policypriority;
        var device_policy;

        var devices = db.query(sqlscripts.devices.select40, deviceid, tenantID);

        if (devices != null && devices[0] != null) {

            var policypriority = db.query(sqlscripts.policy_priority.select1, policytype);

            var datetime = common.getCurrentDateTime();
            if (revokepolicyid == null) {
                //Revoke the policy specificed
                device_policy = db.query(sqlscripts.device_policy.select1, deviceid, tenantID, policypriority[0].priority);
            } else {
                //Revoke the policy using the revoke policy id
                device_policy = db.query(sqlscripts.device_policy.select2, deviceid, tenantID, revokepolicyid, policypriority[0].priority);
            }

            //Check if device already has a policy if so then revoke it
            if (device_policy != null && device_policy[0] != null) {
                if (devices[0].platform_type == "iOS") {
                    sendMessageToIOSDevice({'deviceid':deviceid, 'operation':'REVOKEPOLICY', 'data':parse(device_policy[0].payload_uids), 'policyid':revokepolicyid});
                } else if (devices[0].platform_type == "Android"){
                    var revokepolicy = {};
                    revokepolicy.policyid = revokepolicyid;
                    sendMessageToAndroidDevice({'deviceid':deviceid, 'operation':'REVOKEPOLICY', 'data':revokepolicy});
                }
                db.query(sqlscripts.device_policy.update1, device_policy[0].id);
            }
        }

    }

    function saveDevicePolicy(ctx) {
        //Save the Policy to be enforced to device_policy table
        var policyid = ctx.policyid;
        var deviceid = ctx.deviceid;
        var revokepolicyid = ctx.revokepolicyid;
        var tenantID = common.getTenantID();
        var policytype = ctx.policypriority;
        var device_policy;
        var datetime = common.getCurrentDateTime();

        var devices = db.query(sqlscripts.devices.select40, deviceid, tenantID);

        if (devices != null && devices[0] != null) {

            var policypriority = db.query(sqlscripts.policy_priority.select1, policytype);
            var existDevicePolicy = db.query(sqlscripts.device_policy.select3, deviceid, tenantID);

            if (existDevicePolicy != null && existDevicePolicy[0] != null){
                //Check if the new priority has higher precedence then remove old and apply new
                if (policypriority[0].priority <= existDevicePolicy[0].priority){
                    //Remove and apply new policy
                    if (devices[0].platform_type == "iOS") {
                        sendMessageToIOSDevice({'deviceid':deviceid, 'operation':'REVOKEPOLICY', 'data':parse(existDevicePolicy[0].payload_uids), 'policyid':policyid});
                    } else {
                        var revokepolicy = {};
                        revokepolicy.policyid = policyid;
                        sendMessageToAndroidDevice({'deviceid':deviceid, 'operation':'REVOKEPOLICY', 'data':revokepolicy});
                    }

                    db.query(sqlscripts.device_policy.update1, existDevicePolicy[0].id);
                }
            }

            if (policyid != null) {
                device_policy = db.query(sqlscripts.device_policy.select4, deviceid, tenantID);
                datetime = common.getCurrentDateTime();
                if (device_policy[0] == null) {
                    //Check platform and accordingly insert to device_policy table
                    if (devices[0].platform_type == "iOS") {
                        var payloadIdentifiers = common.getPayloadIdentifierMap();
                        var payloadUidArray = new Array();
                        var policyArray = parse(stringify(ctx.data));
                        for(i=0; i<policyArray.length; ++i){
                            var features = db.query(sqlscripts.features.select4, policyArray[i].code);
                            if (features != null && features[0] != null) {
                                var message = {};
                                if (payloadIdentifiers[features[0].name]) {
                                    message.code = "502P";
                                    var payloadUid = {};
                                    payloadUid.fname = features[0].name;
                                    payloadUid.uuid = payloadIdentifiers[features[0].name];
                                    message.data=payloadUid;
                                    payloadUidArray.push(message);
                                }
                            }
                        }

                        db.query(sqlscripts.device_policy.insert1, deviceid, tenantID, policyid, policypriority[0].id, stringify(payloadUidArray), datetime);

                    } else if (devices[0].platform_type == "Android") {

                        db.query(sqlscripts.device_policy.insert2, deviceid, tenantID, policyid, policypriority[0].id, datetime);
                    }
                }
            }

        }

    }

    <!-- android specific functions -->
    function sendMessageToAndroidDevice(ctx){
        var payLoad = stringify(ctx.data);
        var deviceId = ctx.deviceid;
        var operationName = ctx.operation;
        var tenantID = common.getTenantIDFromDevice(deviceId);

        var devices = db.query(sqlscripts.devices.select6, deviceId);

        if(devices == undefined || devices == null || devices[0]== undefined || devices[0] == null ){
            return false;
        }
        var userID = devices[0].user_id;
        if(tenantID==null){
            tenantID = common.getTenantIDFromEmail(userID);
        }
        var osVersion = devices[0].os_version;
        var platformId = devices[0].platform_id;
        var regId = devices[0].reg_id;

        var features = db.query(sqlscripts.features.select1, ctx.operation);
        if(features == undefined || features == null || features[0]== undefined || features[0] == null ){
            return false;
        }
        var featureCode = features[0].code;
        var featureId = features[0].id;
        var featureDescription = features[0].description;

        if (featureCode == "500P") {
            //Revoke policy and save to device_policy
            saveDevicePolicy(ctx);

        } else if(featureCode == "501P"){
            try{
                db.query(sqlscripts.notifications.delete1, deviceId,featureCode);
            }catch (e){
                log.info(e);
            }
        }
        var currentDate = common.getCurrentDateTime();
        db.query(sqlscripts.notifications.insert1, deviceId, -1, payLoad, currentDate, featureCode, userID,featureDescription, tenantID);

        // SQL Check
        var lastRecord = db.query(sqlscripts.general.select1);

        var lastRecordJson = lastRecord[0];
        var token = lastRecordJson["LAST_INSERT_ID()"];
        log.info("Android registration id "+regId);
        log.info("Current feature code "+featureCode);
        log.info("Message token "+token);
        if(featureCode=="500P" || featureCode=="502P"){
            var gcmMSG = gcm.sendViaGCMtoMobile(regId, featureCode, token, payLoad, 30240, "POLICY");
        }else{
            var gcmMSG = gcm.sendViaGCMtoMobile(regId, featureCode, token, payLoad, 3);
        }
        log.info(gcmMSG);
        return true;
    }


    <!-- iOs specific functions-->
    function invokeInitialFunctions(ctx) {
        var db = application.get('db');
        var tenantID = common.getTenantID();
        var devices = db.query(sqlscripts.devices.select7 ,ctx.deviceid);
        var deviceID = devices[0].id;
        var userId = devices[0].user_id;

        sendMessageToIOSDevice({'deviceid':deviceID, 'operation': "INFO", 'data': "hi"});
        sendMessageToIOSDevice({'deviceid':deviceID, 'operation': "APPLIST", 'data': "hi"});

        var mdmPolicy = getPolicyPayLoad(deviceID,1);
        if(mdmPolicy != undefined && mdmPolicy != null){
            if(mdmPolicy.payLoad != undefined && mdmPolicy.payLoad != null){

                log.debug("Policy Payload >>>>>>>>> " + stringify(mdmPolicy.payLoad));


                sendMessageToIOSDevice({'deviceid':deviceID, 'operation': "POLICY", 'data': mdmPolicy.payLoad, 'policyid':mdmPolicy.policyid, 'policypriority': mdmPolicy.policypriority});
            }
        }

    }

    function sendMessageToIOSDevice(ctx){
        log.debug("CTX >>>>>"+stringify(ctx));
        var deviceID = ctx.deviceid;
        var tenantID = common.getTenantIDFromDevice(deviceID);
        var message = stringify(ctx.data);

        // Filter the policy depending on Device
        if (ctx.operation == 'MONITORING') {
            log.debug("Message >>>>>> " + message);
            var filterMessage = policyFiltering({'deviceid': ctx.deviceid, 'operation':ctx.operation, 'data': ctx.data.policies});
            if (filterMessage != null) {
                log.debug("MONITORING");
                log.debug("Old Message >>>>> " + message);
                ctx.data.policies = filterMessage;
                message = stringify(ctx.data);
                log.debug("New Message >>>>> " + message);
            }
        } else if (ctx.operation == "POLICY") {
            var filterMessage = policyFiltering({'deviceid': ctx.deviceid, 'operation':ctx.operation, 'data': ctx.data});
            if (filterMessage != null) {
                log.debug("POLICY");
                log.debug("Old Message >>>>> " + message);
                log.debug("New Message >>>>> " + stringify(filterMessage));
                message = stringify(filterMessage);

                //Revoke policy and save to device_policy
                saveDevicePolicy(ctx);
            }
        }

        var devices = db.query(sqlscripts.devices.select8, ctx.deviceid);

        if(devices == null || devices == undefined || devices[0] == null || devices[0] == undefined) {
            return;
        }

        // Fixed error log which is created when device is removed while
		// monitoring is happening. Log used to show empty JSON string
        if (devices[0].reg_id == null || devices[0].reg_id == undefined) {
            return;
        } else if (devices[0].reg_id.trim().length == 0) {
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

        var users = db.query(sqlscripts.devices.select9, ctx.deviceid);
        var userId = users[0].user_id;
        var datetime =  common.getCurrentDateTime();

        log.error("Test operation "+ctx.operation);

        var features = db.query(sqlscripts.features.select2, ctx.operation);

        if(features == null || features == undefined || features[0] == null || features[0] == undefined) {
            return false;
        }

        var featureCode = features[0].code;
        var featureDescription = features[0].description;
        if(featureCode == "501P"){
            try{
                db.query(sqlscripts.notifications.delete1, ctx.deviceid,featureCode);
            }catch (e){
                log.info(e);
            }
        } else if(ctx.operation == "NOTIFICATION") { 
        	
            var deviceResults = db.query(sqlscripts.devices.select39, ctx.deviceid);
            
            if(deviceResults != null &&  deviceResults[0] != null) {
            	
            	var pushToken = deviceResults[0].push_token;
            	var messageObj = parse(message);
            	common.sendIOSPushNotifications(pushToken, messageObj.notification);
            }
            
            return;
            
        } else if(ctx.operation == "MUTE") { 
        	
            var deviceResults = db.query(sqlscripts.devices.select39, ctx.deviceid);
            
            if(deviceResults != null &&  deviceResults[0] != null) {
            	
            	var pushToken = deviceResults[0].push_token;
            	common.sendIOSPushNotifications(pushToken, "Device Muted");
            }
            
            return;
            
        }

        // Check if the feature code is a monitoring and status is "A" or "P"
        var notifyExists = db.query(sqlscripts.notifications.select1, ctx.deviceid, featureCode);
        log.debug("notifyExists >>>>> " + stringify(notifyExists[0]));
        if (notifyExists[0].count == 0) {
            log.debug("insert into notifications!!!!!!!!!!!");
            db.query(sqlscripts.notifications.insert2, ctx.deviceid, message, datetime, featureCode, userId, featureDescription, common.getTenantIDFromEmail(userId));
        }

        var sendToAPNS = null;
        var lastApnsTime = db.query(sqlscripts.device_awake.select1, ctx.deviceid);
        log.debug("lastApnsTime >>>>>>>>> " + stringify(lastApnsTime[0]));
        if (lastApnsTime != null && lastApnsTime[0] != null && lastApnsTime != undefined && lastApnsTime[0] != undefined) {
            // 1 hr = 60 * 60 = 3600 seconds
            if (lastApnsTime[0].seconds != null && lastApnsTime[0].seconds != undefined) {
                if (lastApnsTime[0].seconds >= 3600) {
                    sendToAPNS = "UPDATE";
                }
            }else {
                sendToAPNS = "INSERT";
            }
        } else {
            sendToAPNS = "INSERT";
        }

        if (sendToAPNS != null) {
            try {
                log.debug("sendMessageToIOSDevice >>>>>>>> common.initAPNS");
                common.initAPNS(deviceToken, pushMagicToken);
            } catch (e) {
                db.query(sqlscripts.device_awake.update1, datetime, ctx.deviceid);
                log.error(e);
                return;
            }
            log.debug("sendToAPNS value >>>>>>>>> " + sendToAPNS);
            if (sendToAPNS == "INSERT") {
                db.query(sqlscripts.device_awake.insert1, ctx.deviceid, datetime);
            } else if (sendToAPNS == "UPDATE") {
                db.query(sqlscripts.device_awake.update2, datetime, ctx.deviceid);
            }
        }

        return true;
    }

    function checkPendingOperations() {
        // This function is not used anymore.. this can be removed during
		// refactoring
        var tenantID = common.getTenantID();
        var pendingOperations = db.query(sqlscripts.notifications.select2);

        for(var i = 0; i < pendingOperations.length; i++) {

            var deviceId = pendingOperations[i].device_id;
            var devices = db.query(sqlscripts.devices.select10, deviceId,tenantID);

            if(devices != null && devices[0] != null && devices != undefined && devices[0] != undefined) {
                var regId = devices[0].reg_id;
                var regIdJsonObj = parse(regId);
                var pushMagicToken = regIdJsonObj.magicToken;
                var deviceToken = regIdJsonObj.token;
                log.debug("checkPendingOperations >>>>>>>> common.initAPNS");
                log.debug("checkPendingOperations >>>>>>>> " + request.getRequestURL());
                try {
                    common.initAPNS(deviceToken, pushMagicToken);
                } catch (e) {
                    log.error(e);
                    return;
                }
            }
        }

    }

    function policyFiltering(ctx) {
        // This function is used to filter policy based on the platform
        var tenantID = common.getTenantID();
        log.debug("policyFiltering >>>>>"+stringify(ctx));

        var device_id = String(ctx.deviceid);
        var deviceFeature;
        var messageArray
        var i = 0;

        // if (ctx.operation == "POLICY" || ctx.operation == 'MONITORING') {
        // Filter and remove Policies which are not valid for platform
        log.debug(ctx.operation);
        messageArray = parse(stringify(ctx.data));
        log.debug("Policy codes before: " + messageArray.length);
        while (i < messageArray.length) {
            log.debug("Policy code: " + messageArray[i].code);

            if(messageArray[i].code == "509A" || messageArray[i].code == "528B") {

                var appInstallInfo = messageArray[i].data;
                log.debug("appInstallInfo >>>>>>> " + appInstallInfo);
                var platforms = db.query(sqlscripts.platforms.select4, device_id, appInstallInfo.os);
                if(platforms[0].count == 0) {
                    //This app is not compatible with this device
                    messageArray.splice(i,1);
                } else {
                    ++i;
                }
            } else {
                deviceFeature = db.query(sqlscripts.platformfeatures.select2, device_id, messageArray[i].code);

                log.debug("Device Feature: " + deviceFeature[0].count);
                if (deviceFeature[0].count == 0) {
                    // feature not available for the platform
                    messageArray.splice(i,1);
                } else {
                    ++i;
                }
            }
        }
        log.debug("Policy codes: " + messageArray.length);
        return messageArray;
        // }
        // return null;
    }

    // prototype
    module.prototype = {
        constructor: module,
        <!-- common functions -->
        getAppForDevice: function() {

            var userAgent= request.getHeader("User-Agent");

            if (userAgent.indexOf("Android") > 0) {
                return (configFile.device.android_location);
            } else if (userAgent.indexOf("iPhone") > 0) {
                return("itms-services://?action=download-manifest&url=itms-services://?action=download-manifest&url=" + configFile.HTTP_URL + "/mdm/api/devices/ios/download");
            } else if (userAgent.indexOf("iPad") > 0){
                return("itms-services://?action=download-manifest&url=itms-services://?action=download-manifest&url=" + configFile.HTTP_URL + "/mdm/api/devices/ios/download");
            } else if (userAgent.indexOf("iPod") > 0){
                return("itms-services://?action=download-manifest&url=itms-services://?action=download-manifest&url=" + configFile.HTTP_URL + "/mdm/api/devices/ios/download");
            }
        },

        validateDevice: function() {

            //Allow Android version 4.0.3 and above
            //Allow iOS (iPhone and iPad) version 5.0 and above
            var userOS; //will either be iOS, Android or unknown
            var userOSversion;  //will be a string, use Number(userOSversion) to convert
            var useragent = arguments[0];
            var uaindex;

            log.debug(" >>>>>>> " + useragent);

            //determine the OS
            if(useragent.match(/iPad/i) || useragent.match(/iPhone/i)) {
                userOS = 'iOS';
                uaindex = useragent.indexOf('OS ');
            } else if (useragent.match(/Tablet/i)) {
                return true;
            } else if (useragent.match(/Android/i)) {
                userOS = 'Android';
                uaindex = useragent.indexOf('Android ');
            } else {
                userOS = 'unknown';
            }

            //determine version
            if (userOS == 'iOS' && uaindex > -1) {
                userOSversion = useragent.substr(uaindex + 3, 3).replace('_', '.');
            } else if (userOS == 'Android' && uaindex > -1) {
                userOSversion = useragent.substr(uaindex + 8, 3);
            } else {
                userOSversion = 'unknown';
            }

            if (userOS == 'Android' && userOSversion.substr(0, 4) == '4.0.') {
                if(Number(userOSversion.charAt(4)) >= 3 ) {
                    //Allow device
                    return true;
                }else {
                    //Android version not allowed
                    return false;
                }
            } else if (userOS == 'Android' && Number(userOSversion.substr(0,3)) >= 4.1) {
                //Allow device
                return true;
            } else if(userOS == 'iOS' && Number(userOSversion.charAt(0)) >= 5) {
                //Allow device
                return true;
            } else {
                return false;
            }
        },


        getLicenseAgreement: function(ctx){
            return (user.getLicenseByDomain(ctx.domain));
        },
        sendToDevice: function(ctx){
        	var tenantID = common.getTenantID();
            log.debug("MSG format :"+stringify(ctx.data));
            log.debug(ctx.deviceid);
            log.debug(ctx.operation);

            var devices = db.query(sqlscripts.devices.select11, ctx.deviceid);

            if(devices == null || devices == undefined || 
            		devices[0] == null || devices[0] == undefined) {
            	return;
            }
            
            var platformID = devices[0].platform_id;
            if(platformID==1){
                return sendMessageToAndroidDevice(ctx);
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
        getFeaturesFromDevice: function(ctx){
            init();
            var role = ctx.role;
            var deviceId =  ctx.deviceid;
            if(role=="user"){
                role = group.getEffectiveRoleFromDeviceID(deviceId);
                log.debug("Test Role :"+role);
            }
            var tenantID = common.getTenantID();
            log.debug("Test Role :"+role);

            var featureList = db.query(sqlscripts.devices.select12, stringify(deviceId));

            var obj = new Array();
            for(var i=0; i<featureList.length; i++){
                var featureArr = {};

                var ftype = db.query(sqlscripts.featuretype.select1, stringify(featureList[i].id));

                featureArr["name"] = featureList[i].name;
                featureArr["feature_code"] = featureList[i].code;
                featureArr["feature_type"] = ftype[0].name;
                featureArr["description"] = featureList[i].description;
                // log.info(checkPermission(role,deviceId, featureList[i].name,
				// this));
                featureArr["enable"] = checkPermission(role,deviceId, featureList[i].name, this);
                // featureArr["enable"] = true;
                if(featureList[i].template === null || featureList[i].template === ""){

                }else{
                    featureArr["template"] = featureList[i].template;
                }
                obj.push(featureArr);
            }
            return obj;
        },
        sendMsgToUserDevices: function(ctx){
        	var tenantID = common.getTenantID();
            var device_list = db.query(sqlscripts.devices.select13, ctx.userid, tenantID);
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
			var tenantID = common.getTenantID();
            var userList = group.getUsersOfGroup();

            for(var i = 0; i < userList.length; i++) {

                var objUser = {};
                var result = db.query(sqlscripts.devices.select14, String(userList[i].email), tenantID);

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
        monitoring:function(ctx){
            application.put("that",this);
            try{
                setInterval((application.get("that")).monitor({}),100000);
            }catch (e){
                log.debug("Error In Monitoring");
            }

        },
        monitor:function(ctx){
            log.debug("monitor");

            var result = db.query(sqlscripts.devices.select44);
            for(var i=0; i<result.length; i++){
                var deviceId = result[i].id;
                var operation = 'MONITORING';
                this.sendToDevice({'deviceid':deviceId,'operation':'INFO','data':{}});
                this.sendToDevice({'deviceid':deviceId,'operation':'APPLIST','data':{}});
                var mdmPolicy = getPolicyPayLoad(deviceId,1);
                log.info("Policy Payload :"+mdmPolicy);
                if(mdmPolicy != undefined && mdmPolicy != null){
                    if(mdmPolicy.payLoad != undefined && mdmPolicy.payLoad != null && mdmPolicy.type != undefined && mdmPolicy.type != null){
                        var obj = {};
                        obj.type = mdmPolicy.type;
                        obj.policies = mdmPolicy.payLoad;
                        this.sendToDevice({'deviceid':deviceId,'operation':operation,'data':obj});
                    }
                }
            }
        },
        changeDeviceState:function(deviceId,state){
        	var tenantID = common.getTenantID();
            db.query(sqlscripts.devices.update1, state, stringify(deviceId));
        },
        saveDevicePolicy: saveDevicePolicy,
        removeDevicePolicy: removeDevicePolicy,
        separateMAMPolicy: separateMAMPolicy,

        <!-- android specific functions -->
        getSenderId: function(ctx){
            var androidConfig = require('/config/android.json');
            log.info(androidConfig);
            return androidConfig.sender_id;
        },
        isRegistered: function(ctx){
            if(ctx.regid != undefined && ctx.regid != null && ctx.regid != ''){
                var result = db.query(sqlscripts.devices.select17, ctx.regid);
                var state = (result != null && result != undefined && result[0] != null && result[0] != undefined);
                return state;
            }else if(ctx.udid != undefined && ctx.udid != null && ctx.udid != ''){
                var result = db.query(sqlscripts.devices.select18, ctx.udid);
                var state = (result != null && result != undefined && result[0] != null && result[0] != undefined);
                return state;
            }
        },
        registerAndroid: function(ctx){
            var log = new Log();
          // ctx.email = ctx.email+"@carbon.super";
            var tenantUser = carbon.server.tenantUser(ctx.email);
            var userId = tenantUser.username;
            var tenantId = tenantUser.tenantId;
            var platforms = db.query(sqlscripts.platforms.select1, ctx.platform);
            var platformId = platforms[0].id;

            var createdDate =  common.getCurrentDateTime();

            if(ctx.regid!=null){
                var result = db.query(sqlscripts.devices.select19, ctx.regid);

                if(result[0]==null){

                    var roleList = user.getUserRoles({'username':userId});
                    var removeRoles = new Array("Internal/everyone", "portal", "wso2.anonymous.role", "reviewer","private_kasun:wso2mobile.com");
                    var roles = common.removeNecessaryElements(roleList,removeRoles);
                    var role = roles[0];
                    db.query(sqlscripts.devices.insert1, tenantId, ctx.osversion, createdDate, ctx.properties, ctx.regid, userId, platformId, ctx.vendor, ctx.mac);
                    var devices = db.query(sqlscripts.devices.select19, ctx.regid);
                    var deviceID = devices[0].id;
                    log.info("Android Device has been registered "+ctx.regid);
                    sendMessageToAndroidDevice({'deviceid':deviceID, 'operation': "INFO", 'data': "hi"});
                    sendMessageToAndroidDevice({'deviceid':deviceID, 'operation': "APPLIST", 'data': "hi"});

                    var mdmPolicy = getPolicyPayLoad(deviceID,1);
                    if(mdmPolicy != undefined && mdmPolicy != null){
                        if(mdmPolicy.payLoad != undefined && mdmPolicy.payLoad != null){
                            sendMessageToAndroidDevice({'deviceid':deviceID, 'operation': "POLICY", 'data': mdmPolicy.payLoad, 'policyid':mdmPolicy.policyid, 'policypriority': mdmPolicy.policypriority});
                        }
                    }
                    return true;
                }else{
                    db.query(sqlscripts.devices.update2, ctx.regid, tenantId);
                    return true;
                }
            }else{

            }
        },
        unRegisterAndroid:function(ctx){
            if(ctx.regid!=null){
                var devices = db.query(sqlscripts.devices.select41, ctx.regid);
                var result = db.query(sqlscripts.devices.delete1, ctx.regid);
                if(result == 1){
                    db.query(sqlscripts.device_policy.update2, devices[0].id);
                    return true;
                }else{
                    return false
                }
            }else{
                return false;
            }
        },
        
        <!-- iOS specific functions -->
        registerIOS: function(ctx){
            var tenantUser = carbon.server.tenantUser(ctx.auth_token);
            var userId = tenantUser.username;
            var tenantId = tenantUser.tenantId;

            var platforms = db.query(sqlscripts.platforms.select1, ctx.platform);
            var platformId = platforms[0].id;
            var createdDate = common.getCurrentDateTime();
            var devicesCheckUDID = db.query(sqlscripts.device_pending.select1, ctx.auth_token);

            // Save device data into temporary table
            if(devicesCheckUDID != undefined && devicesCheckUDID != null && devicesCheckUDID[0] != undefined && devicesCheckUDID[0] != null){

                db.query(sqlscripts.device_pending.update1, tenantId, userId, platformId, stringify(ctx.properties), createdDate, ctx.vendor, ctx.udid, ctx.auth_token);
            } else {

                db.query(sqlscripts.device_pending.insert1, tenantId, userId, platformId, stringify(ctx.properties), createdDate, ctx.vendor, ctx.udid, ctx.auth_token);
            }

            return true;
        },
        getPendingOperationsFromDevice: function(ctx){

            var deviceList = db.query(sqlscripts.devices.select20, parse(ctx.udid));
            if(deviceList[0]!=null) {
                var deviceID = String(deviceList[0].id);
                var pendingFeatureCodeList=db.query(sqlscripts.notifications.select3, deviceID);

                if(pendingFeatureCodeList!=undefined && pendingFeatureCodeList != null && pendingFeatureCodeList[0]!= undefined && pendingFeatureCodeList[0]!= null){
                    var id = pendingFeatureCodeList[0].id;
                    var feature_code = pendingFeatureCodeList[0].feature_code;

                    if(feature_code == "500P" || feature_code == "502P") {

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

                            db.query(sqlscripts.notifications.update2, stringify(arrEmptyReceivedData), id);
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

                                db.query(sqlscripts.notifications.update2, stringify(received_data), id);

                                if(counter > 3) {
                                    continue;
                                }

                                return parse(stringify(objResponse));
                            }
                        }

                    } else {

                        db.query(sqlscripts.notifications.update3, id);

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

            var result = db.query(sqlscripts.device_pending.select2, ctx.deviceid);

            if(result != null && result != undefined && result[0] != null && result[0] != undefined) {

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

                var userResultExist = db.query(sqlscripts.devices.select21, ctx.deviceid);
                if(userResultExist != null && userResultExist != undefined && userResultExist[0] != null && userResultExist[0] != undefined) {
                	
                	var devicePendingResult = db.query(sqlscripts.device_pending.select3, ctx.deviceid);
	                   
	                if(devicePendingResult != null && devicePendingResult != undefined && devicePendingResult[0] != null && devicePendingResult[0] != undefined) {
	                	devicePendingResult = devicePendingResult[0]

                        var updateResult = db.query(sqlscripts.devices.update3, devicePendingResult.tenant_id, devicePendingResult.user_id, devicePendingResult.platform_id, stringify(tokenProperties), stringify(properties), devicePendingResult.status,
                            devicePendingResult.byod, devicePendingResult.vendor, devicePendingResult.udid, ctx.deviceid);

	                }
	                
	                db.query(sqlscripts.device_pending.update2, devicePendingResult.user_id);

                } else {
                	// Copy record from temporary table into device table and
					// delete the record from the temporary table
                    var updateResult = db.query(sqlscripts.devices.insert2, stringify(tokenProperties), stringify(properties), ctx.deviceid);
	                
	                db.query(sqlscripts.device_pending.update3, ctx.deviceid);
                }

                if(updateResult != null && updateResult != undefined && updateResult == 1) {
                    	
					setTimeout(function(){invokeInitialFunctions(ctx)}, 2000);
                    	
                    return true;
                }
            }

            return false;
        },
        sendMessageToIOSDevice: sendMessageToIOSDevice,
        unRegisterIOS:function(ctx){

            sendMessageToIOSDevice({'deviceid':ctx.udid, 'operation': "ENTERPRISEWIPE", 'data': ""});

            if(ctx.udid != null){
                var devices = db.query(sqlscripts.devices.select20, ctx.udid);
                db.query(sqlscripts.device_awake.update3, ctx.udid);
                var result = db.query(sqlscripts.devices.delete2, ctx.udid);
                if(result == 1){
                    db.query(sqlscripts.device_policy.update2, devices[0].id);
                    return true;
                }else{
                    return false
                }
            }else{
                return false;
            }
        },
        invokeMessageToIOSDevice:function(ctx) {
        	sendMessageToIOSDevice(ctx);
        },
        updateDeviceProperties:function(deviceId, osVersion, deviceName, wifiMac) {

            var deviceResult = db.query(sqlscripts.devices.select22, deviceId);

            var properties = deviceResult[0].properties;
        	properties = parse(parse(stringify(properties)));
        	properties["device"] = deviceName;

            db.query(sqlscripts.devices.update4, osVersion, stringify(properties), wifiMac, deviceId + "");

        },
        getCurrentDeviceState:function(deviceId){

            var result = db.query(sqlscripts.devices.select16, stringify(deviceId));
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
        },
        saveiOSPushToken:function(ctx){log.debug("saveiOSPushToken >>>>>> " + ctx.udid + " >>>>>>>>> " + ctx.pushToken);
	        // Save the Push Token to the respective device using UDID
	        if (ctx.pushToken != null || ctx.pushToken != undefined) {
	            
	            var result = db.query(sqlscripts.devices.select23, ctx.udid);
	            if (result[0].count > 0) {
	                db.query(sqlscripts.devices.update5, ctx.pushToken, ctx.udid);
	            } else {
	                return null;
	            }
	            return "SUCCESS";
	        }
	        return null;
	
	        db.query(sqlscripts.devices.update6, osVersion, stringify(properties), deviceId);
	
	    },
	    updateLocation: function(ctx){
	    	
	        var result = db.query(sqlscripts.devices.select38, ctx.udid);
	        
	        if(result != null && result != undefined && result[0] != null && result[0] != undefined) {
	
	            var properties = parse(result[0].properties);
	           
	            properties["latitude"] = ctx.latitude;
	            properties["longitude"] = ctx.longitude;
	            
	            db.query(sqlscripts.devices.update7, properties, ctx.udid);
	
	        }
	
	        return false;
	    }
    };

    return module;
})();


