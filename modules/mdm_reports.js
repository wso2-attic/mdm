
var mdm_reports = (function () {

    var deviceModule = require('device.js').device;
    var device;

    var common = require("common.js");

    var configs = {
        CONTEXT: "/"
    };
    var routes = new Array();
    var log = new Log();
    var db;

    var module = function (dbs) {
        db = dbs;
        device = new deviceModule(db);
        //mergeRecursive(configs, conf);
    };

    function mergeRecursive(obj1, obj2) {
        for (var p in obj2) {
            try {
                // Property in destination object set; update its value.
                if (obj2[p].constructor == Object) {
                    obj1[p] = mergeRecursive(obj1[p], obj2[p]);
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
    function getComplianceStateFromReceivedData(receivedData){
        for(var i = 0; i< receivedData.length; i++){
            if(receivedData[i].status == false){
                return false;
            }
        }
        return true;
    }
    function getComplianceInfoFromReceivedData(receivedData){
        var newArray = new Array();
        for(var i = 0; i< receivedData.length; i++){
            if(receivedData[i].code == 'notrooted'){
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
        return newArray;
    }
    function getComplianceStateChanges(result){
        var state = getComplianceStateFromReceivedData(parse(result[0].received_data));
        var array = new Array();
        var obj = {};
        obj.userID =  result[0].user_id;
        obj.timeStamp = result[0].received_date;
        obj.resons = getComplianceInfoFromReceivedData(parse(result[0].received_data));
        obj.status = state;
        array.push(obj);

        for(var i = 1; i<result.length;i++){
            if(getComplianceStateFromReceivedData(parse(result[i].received_data)) !== state){
                state = getComplianceStateFromReceivedData(parse(result[i].received_data));
                var obj = {};
                obj.userID =  result[0].user_id;
                obj.timeStamp = result[0].received_date;
                obj.resons = getComplianceInfoFromReceivedData(parse(result[0].received_data));
                obj.status = state;
                array.push(obj);
            }
        }
        return  array;
    }
    module.prototype = {
        constructor: module,
        getDevicesByRegisteredDate:function(ctx){
            /*ctx.startDate =  '2013-12-23';
            ctx.endDate = '2013-12-24';
            ctx.platformType = 1;*/
            var zeros = ' 00:00:00';
            var startDate = ctx.startDate+zeros;
            var endDate = ctx.endDate+zeros;
            var result = [];
            if(typeof ctx.platformType !== 'undefined' && ctx.platformType !== 0){
                result = db.query("SELECT devices.user_id, devices.properties, platforms.name as platform_name, devices.os_version, devices.created_date, devices.status  FROM devices,platforms where platforms.type ="+ctx.platformType+" && platforms.id = devices.platform_id  &&  devices.created_date between '"+startDate+"' and '"+endDate+"' and  devices.tenant_id = "+common.getTenantID());
            }else{
                result = db.query("SELECT devices.user_id, devices.properties, platforms.name as platform_name, devices.os_version, devices.created_date, devices.status  FROM devices, platforms where devices.created_date between '"+startDate+"' and '"+endDate+"' and  devices.tenant_id = "+common.getTenantID()+"&& devices.platform_id = platforms.id");
            }
            if(typeof result !== 'undefined' && result !== null && typeof result[0] !== 'undefined' && result[0] !== null ){
                for(var i=0; i< result.length;i++){
                    result[i].imei = parse(result[i].properties).imei;
                }
                return  result;
            }else{
                return null;
            }
        },
        getComplianceStatus:function(ctx){
            var zeros = ' 00:00:00';
            var startDate = ctx.startDate+zeros;
            var endDate = ctx.endDate+zeros;
            var result = db.query("select * from notifications where feature_code = '501P' && devices_id ="+ctx.deviceID+"&& received_date between '"+startDate+"' and '"+endDate+"' and tenent_id = "+common.getTenantID());
            var stateChangesArray = getComplianceStateChanges(result);
            return stateChangesArray;
        }
    };
    return module;
})();