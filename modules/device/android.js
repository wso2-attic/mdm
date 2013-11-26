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
}
androidDevice.prototype = new device();
