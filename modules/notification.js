var notification = (function () {
    var configs = {
        CONTEXT: "/"
    };
    var routes = new Array();
    var log = new Log();
    var db;
	var common = require("/modules/common.js");
    var deviceModule = require('device.js').device;
    var device;
    var module = function (dbs) {
        db = dbs;
        device = new deviceModule(db);
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

    // prototype
    module.prototype = {
        constructor: module,
        getNotifications: function(ctx){
            var result = db.query("SELECT * FROM notifications WHERE device_id = ? ORDER BY id DESC LIMIT 10", ctx.deviceid);

            var notifications = new Array();
            for (i=0; i<result.length; i++){
                var obj = {};
                obj.sent_date =  common.getFormattedDate(result[i].sent_date);
                obj.received_date = common.getFormattedDate(result[i].received_date);
                obj.received_data = result[i].received_data;
                obj.feature_code =  result[i].feature_code;
                obj.feature_description =  result[i].feature_description;
                notifications[i] = obj;
            }
            return notifications;
        },
        addIosNotification: function(ctx){
            //log.info("IOS Notification >>>>>"+stringify(ctx));

            var identifier = ctx.msgID.replace("\"", "").replace("\"","")+"";
            var notifications = db.query("SELECT message, feature_code, device_id FROM notifications WHERE id = ?", identifier);
            var recivedDate =  common.getCurrentDateTime();
            
            if(notifications != null &&  notifications[0] != null) {
                var featureCode = notifications[0].feature_code;
                var device_id = notifications[0].device_id;
                var message = notifications[0].message;

                if(featureCode == "500P") {

                    var notificationId = identifier.split("-")[0];
                    var policySequence = identifier.split("-")[1];

                    var pendingFeatureCodeList = db.query("SELECT received_data, device_id FROM notifications WHERE id = ?", notificationId + "");
                    var received_data = pendingFeatureCodeList[0].received_data;
                    var device_id = pendingFeatureCodeList[0].device_id;
                    var targetOperationData = (parse(received_data))[parseInt(policySequence)];
                    var targetOperationId = targetOperationData.message.code;
                    var pendingExist = false;
                    var parsedReceivedData = (parse(received_data));

                    for(var i = 0; i < parsedReceivedData.length; i++) {
                        var receivedObject = parsedReceivedData[i];

                        if(receivedObject.message.code == targetOperationId) {
                            if(ctx.error == "Error") {
                                receivedObject.status = "error";
                            } else {
                                receivedObject.status = "received";
                            }
                        }

                        if(receivedObject.status == "pending") {
                            pendingExist = true;
                        }

                        parsedReceivedData[i] = receivedObject;
                    }

                    db.query("UPDATE notifications SET received_data= ? , received_date = ? WHERE id = ?", stringify(parsedReceivedData) + "", recivedDate + "", notificationId);

                    if(pendingExist) {

                        /*
                        var message = stringify(ctx.data);
                        var devices = db.query("SELECT reg_id FROM devices WHERE id = ?", device_id + "");
                        var regId = devices[0].reg_id;
                        var regIdJsonObj = parse(regId);
                        var pushMagicToken = regIdJsonObj.magicToken;
                        var deviceToken = regIdJsonObj.token;
                        try {
                            common.initAPNS(deviceToken, pushMagicToken);
                        } catch (e) {
                            log.error(e);
                        }
                        */
                        return true;

                    } else {
                        db.query("UPDATE notifications SET status='R' WHERE id = ?", notificationId);
                        
                        var ctx = {};
                        ctx.id = notificationId;
                        this.discardOldNotifications(ctx);
                    }

                } else if(featureCode == "501P") {
                    
                    var parsedReceivedData = parse(parse(stringify(ctx.data)));
                    var formattedData = new Array();
                    var featureCodeArray =  new Array();

                    for(var i = 0; i < parsedReceivedData.length; i++) {
                        var receivedObject = parsedReceivedData[i];
                        var payloadIdentifier = receivedObject.PayloadIdentifier;

                        var featureName = common.getValueByFeatureIdentifier(payloadIdentifier);

                        if(featureName == null) {
                            continue;
                        }

                        var featureCodes = db.query("SELECT code FROM features WHERE name = ?", featureName);

                        if(featureCodes == null || featureCodes[0] == null || featureCodes[0].code == null) {
                            continue;
                        }

                        var innerResponse = {};
                        innerResponse.status = true;
                        innerResponse.code = featureCodes[0].code;
                        formattedData.push(innerResponse);
                        featureCodeArray.push(featureCodes[0].code);
                    }
                    	
				    var receivedData = parse(message);
				    var policies = receivedData["policies"];
                	
                	for(var i = 0; i < policies.length; i++) {
                		
                		var receivedElement = policies[i];
                		var code = receivedElement["code"];
                		
                		var isExist = false;
                		
                		for(var j = 0; j < featureCodeArray.length; j++) {
                			var featureCode = featureCodeArray[j];

                			if(featureCode == code) {
                				isExist = true;
                				break;
                			}
                		}
                		
                		if(!isExist) {
	                    	var innerResponse = {};
	                        innerResponse.status = false;
	                        innerResponse.code = code;
	                        formattedData.push(innerResponse);
                		}
                	}
                    try{
                        log.info("dddddddddddddd :"+device_id);
                        log.info("ffffffffffff :"+featureCode);
                        db.query("DELETE FROM notifications WHERE device_id = ? AND status='R' AND feature_code = ?",device_id,"501P");
                    }catch(e){
                        log.info(e);
                    }
                    db.query("UPDATE notifications SET status='R', received_data= ? , received_date = ? WHERE id = ?", stringify(formattedData) +"", recivedDate+"", identifier);

                } else {
                    var policySeperator = identifier.indexOf("-");

                    if(policySeperator == -1) {
                        db.query("UPDATE notifications SET status='R', received_data= ? , received_date = ? WHERE id = ?", ctx.data+"", recivedDate+"", identifier);
                    }
                    
                    if(featureCode == "500A") {
                    	
                    	var dataObj = parse(parse(stringify(ctx.data)));
                    	var deviceName = dataObj["DeviceName"];
                    	var osVersion = dataObj["OSVersion"];
                    	
                    	var notifications = db.query("SELECT device_id FROM notifications WHERE id = ?", identifier + "");
                    	var deviceId = notifications[0].device_id;

                    	device.updateDeviceProperties(deviceId, osVersion, deviceName);
                    }
                }
            }
        },
        addNotification: function(ctx){
			log.info("Android Notification >>>>>"+stringify(ctx));
			log.info("CTX>>>>>>>>>>>>>>>>>>" + ctx.msgID);
            var recivedDate = common.getCurrentDateTime();
            var result = db.query("select * from notifications where id = '"+ctx.msgID+"'");
            var deviceId =  result[0].device_id;
            var featureCode =  result[0].feature_code;
            if(featureCode == "501P"){
                try{
                    db.query("DELETE FROM notifications WHERE device_id = ? AND status='R' AND feature_code = ?",deviceId,featureCode);
                }catch(e){
                    log.info(e);
                }
            }
            db.query("UPDATE notifications SET status='R', received_data = ? , received_date = ? WHERE id = ?", ctx.data, recivedDate, ctx.msgID);
        },
        getLastRecord: function(ctx){
            log.info("Operation >>>>>>"+ctx.operation);
            var result = db.query("SELECT DISTINCT * FROM notifications WHERE received_data IS NOT NULL && device_id = ? && feature_code= ?", ctx.deviceid, ctx.operation);
            var features = db.query("SELECT * FROM features WHERE code= ?", ctx.operation);
            ctx.operation = String(features[0].name);
            ctx.data = "hi";
        //    device.sendToDevice(ctx);
            if(result == null || result == undefined ||result.length == 0) {
                return {};
            }
            return result[result.length-1];
        },
        getPolicyState: function(ctx){
            
            var result = db.query("SELECT DISTINCT * FROM notifications WHERE received_data IS NOT NULL && device_id = ? && feature_code= ?", ctx.deviceid, '501P');
            // log.info("RRR"+stringify(result[0].received_data));
            var newArray = new Array();
            if(result == null || result == undefined ||result.length == 0) {
                return newArray;
            }
            var arrayFromDatabase = parse(result[result.length-1].received_data);
            for(var i = 0; i< arrayFromDatabase.length; i++){
               if(arrayFromDatabase[i].code == 'notrooted'){
                   var obj = {};
                   obj.name = 'Not Rooted';
                   obj.status = arrayFromDatabase[i].status;
                   newArray.push(obj);
                   if(obj.status == false){
                       log.info(obj.status);
                       log.info(ctx.deviceid);
                        device.changeDeviceState(ctx.deviceid, "C");
                   }

               }else{
                   var featureCode = arrayFromDatabase[i].code;
                   try{
                       var obj = {};
                       var features = db.query("SELECT * FROM features WHERE code= '"+featureCode+"'");
                       obj.name = features[0].description;
                       obj.status = arrayFromDatabase[i].status;
                       newArray.push(obj);
                       if(obj.status == false){
                            var currentState = device.getCurrentDeviceState(ctx.deviceid);
                            if(currentState == 'A'){
                                device.changeDeviceState(ctx.deviceid,"PV");
                            }
                       }

                   }catch(e){
                       log.info(e);
                   }
               }
            }
			
            log.info("Final result >>>>>>>>>>"+stringify(newArray));
            return newArray;
        },
        getPolicyComplianceDevices:function(ctx){
            var compliance = ctx.compliance;

            var complianceDevices = new Array();
            var violatedDevices = new Array();
            var devices = db.query("SELECT * from devices");
            for(var i=0;i<devices.length;i++){
                var compliances =  this.getPolicyState({'deviceid':devices[i].id});
                var flag = true;
                for(var j=0;j<compliances.length;j++){
                    if(compliances[j].status == false){
                        flag = false;
                        break;
                    }
                }
                if(flag){
                    var obj = {};
                    obj.id =  devices[i].id;
                    obj.properties = devices[i].properties;
                    obj.username = devices[i].user_id;
                    complianceDevices.push(obj);
                }else{
                    var obj = {};
                    obj.id =  devices[i].id;
                    obj.properties = devices[i].properties;
                    obj.username = devices[i].user_id;
                    violatedDevices.push(obj);
                }

            }

            if(compliance){
                return complianceDevices;
            }else{
                return violatedDevices;
            }
        },
        getPolicyComplianceDevicesCount:function(ctx){
            var complianceDeviceCount = this.getPolicyComplianceDevices({'compliance':true}).length;
            var violatedDevicesCount = this.getPolicyComplianceDevices({'compliance':false}).length;
            var totalDevicesCount =  complianceDeviceCount+violatedDevicesCount;
            var complianceDeviceCountAsPercentage =  (complianceDeviceCount/(totalDevicesCount))*100;
            var violatedDevicesCountAsPercentage = (violatedDevicesCount/(totalDevicesCount))*100;
            var array = new Array();
            var obj1 = {};
            obj1.label = 'Compliance';
            obj1.data =  complianceDeviceCountAsPercentage;

            array.push(obj1);

            var obj2 = {};
            obj2.label = 'Non Compliance';
            obj2.data =  violatedDevicesCountAsPercentage;

            array.push(obj2);
            return array;
        }, discardOldNotifications:function(ctx) {
        	
        	var currentOperation = db.query("SELECT received_date, device_id, feature_code, user_id FROM notifications WHERE id = ? AND feature_code != '500P' ", parseInt(ctx.id));
        	
        	if(currentOperation == null || currentOperation[0] == null || currentOperation == undefined || currentOperation[0] == undefined) {
        		return;
        	}
        	
        	var receivedDate = currentOperation[0].received_date;
        	var deviceId = currentOperation[0].device_id;
        	var featureCode = currentOperation[0].feature_code;
        	var userId = currentOperation[0].user_id;
        	
        	db.query("UPDATE notifications SET status = 'D' WHERE device_id = ? AND feature_code = ? AND user_id = ? AND status = 'P'", deviceId, featureCode, userId);
        }

    };
    // return module
    return module;
})();