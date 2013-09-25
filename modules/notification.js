var notification = (function () {
    var configs = {
        CONTEXT: "/"
    };
    var routes = new Array();
    var log = new Log();
    var db;

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
            for (i=0;i<10;i++){

                if(result[i] == null) {
                    notifications[i] = {};
                    continue;
                }

                notifications[i] = result[i];
            }
            return notifications;
        },
        addIosNotification: function(ctx){
			log.info("IOS Notification >>>>>"+stringify(ctx));
            var currentdate = new Date();
            var recivedDate =  currentdate.getDate() + "/"+ (currentdate.getMonth()+1)  + "/"+ currentdate.getFullYear() + " @ "+ currentdate.getHours() + ":"+ currentdate.getMinutes() + ":"+ currentdate.getSeconds();

            db.query("UPDATE notifications SET status='R', received_data= ? , received_date = ? WHERE id = ?", ctx.data+"", recivedDate+"", ctx.msgID.replace("\"", "").replace("\"","")+"");
        },
        addNotification: function(ctx){
			log.info("Android Notification >>>>>"+stringify(ctx));
            var currentdate = new Date();
            var recivedDate =  currentdate.getDate() + "/"+ (currentdate.getMonth()+1)  + "/"+ currentdate.getFullYear() + " @ "+ currentdate.getHours() + ":"+ currentdate.getMinutes() + ":"+ currentdate.getSeconds();

            db.query("UPDATE notifications SET status='R', received_data = ? , received_date = ? WHERE id = ?", ctx.data, recivedDate, ctx.msgID);
        },
        getLastRecord: function(ctx){
            log.info("Operation >>>>>>"+ctx.operation);
            var result = db.query("SELECT DISTINCT * FROM notifications WHERE received_data IS NOT NULL && device_id = ? && feature_code= ?", ctx.deviceid, ctx.operation);
            var features = db.query("SELECT * FROM features WHERE code= ?", ctx.operation);
            ctx.operation = String(features[0].name);
            ctx.data = "hi";
            device.sendToDevice(ctx);
            if(result == null || result == undefined ||
                result.length == 0) {
                return {};
            }

            return result[result.length-1];
        },
        getPolicyState: function(ctx){
            log.info("Test Function :aaaaaaaaaaaaaaaaaaaaa"+ctx.deviceid);

            var result = db.query("SELECT DISTINCT * FROM notifications WHERE received_data IS NOT NULL && device_id = ? && feature_code= ?", ctx.deviceid, '501P');

            if(result == null || result == undefined ||result.length == 0) {
                return {};
            }
            var newArray = new Array();

            var arrayFromDatabase = parse(result[result.length-1].received_data);
            log.info("result >>>>>>>"+stringify(result[result.length-1].received_data));
            log.info(arrayFromDatabase[0]);

            for(var i = 0; i< arrayFromDatabase.length; i++){
               if(arrayFromDatabase[i].code == 'notrooted'){
                   var obj = {};
                   obj.name = 'Not Rooted';
                   obj.status = arrayFromDatabase[i].status;
                   newArray.push(obj);
               }else{
                   var obj = {};
                   var features = db.query("SELECT * FROM features WHERE code= ?", arrayFromDatabase[i].code);
                   obj.name = features[0].description;
                   obj.status = arrayFromDatabase[i].status;
                   newArray.push(obj);
               }

            }
            log.info("Final result >>>>>>>>>>"+stringify(newArray));
            return newArray;
        }
    };
    // return module
    return module;
})();