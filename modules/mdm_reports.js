
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

    module.prototype = {
        constructor: module,
        getDevicesByRegisteredDate:function(ctx){
            var zeros = ' 00:00:00';
            var startDate = ctx.startDate+zeros;
            var endDate = ctx.endDate+zeros;
            var result = db.query("SELECT * FROM devices where platform_id = %"+ctx.platformID+"% && created_date between '"+startDate+"' and '"+endDate+"'");
            if(typeof result !== 'undefined' && result !== null && typeof result[0] !== 'undefined' && result[0] !== null ){
                return  result;
            }else{
                return null;
            }
        }
    };
    return module;
})();