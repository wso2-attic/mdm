var store = (function () {
    var configs = {
        CONTEXT: "/"
    };
    var routes = new Array();
    var log = new Log();
    var db;
    var module = function (dbs) {
        db = dbs;
        //mergeRecursive(configs, conf);
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
        getAllDevicesFromEmail: function(ctx){
	
           log.info("Test platform :"+ctx.data.platform);
           var devicesArray;
		   if(ctx.data.platform=='webapp'){
			   var users = db.query("Select * from users where username='"+ctx.data.email+"'");
               var userID = users[0].id;

               var devices = db.query("select * from devices where devices.user_id="+userID);
               devicesArray = new Array();
               for(var i=0;i<devices.length;i++){
                   var deviceID = devices[i].id;

                   var properties = devices[i].properties;
                   var propertiesJsonObj = parse(properties);
                   var name = propertiesJsonObj.device;
                   var model = propertiesJsonObj.model;

                   var platforms = db.query("select platforms.type_name as platform from devices, platforms where platforms.id = devices.platform_id && devices.id="+deviceID);
                   var platform = platforms[0].platform

                   var packet = {};

                   packet.id = deviceID;
                   packet.name = name;
                   packet.model = model;
                   packet.platform = platform;

                   devicesArray.push(packet);
				}
				return devicesArray;
			}
			
           if(ctx.data.platform!=undefined && ctx.data.platform != null){

               var users = db.query("Select * from users where username='"+ctx.data.email+"'");
               var userID = users[0].id;
           //    ctx.data.platform = "iOS";
                var platforms = db.query("select * from platforms where type_name ='"+ctx.data.platform+"'");
               // platformId = platforms[0].id;

               devicesArray = new Array();

               for(var j=0; j<platforms.length; j++){
                    var devices = db.query("select * from devices where devices.user_id="+userID+" and devices.platform_id = "+platforms[j].id);

                    for(var i=0;i<devices.length;i++){
                        var deviceID = devices[i].id;

                        var properties = devices[i].properties;
                        var propertiesJsonObj = parse(properties);
                        var name = propertiesJsonObj.device;
                        var model = propertiesJsonObj.model;

                        var packet = {};

                        packet.id = deviceID;
                        packet.name = name;
                        packet.model = model;
                        packet.platform = ctx.data.platform;
                        devicesArray.push(packet);
                    }
               }
           }else{
                var users = db.query("Select * from users where username='"+ctx.data.email+"'");
                var userID = users[0].id;

                var devices = db.query("select * from devices where devices.user_id="+userID);
                devicesArray = new Array();
                for(var i=0;i<devices.length;i++){
                    var deviceID = devices[i].id;

                    var properties = devices[i].properties;
                    var propertiesJsonObj = parse(properties);
                    var name = propertiesJsonObj.device;
                    var model = propertiesJsonObj.model;

                    var platforms = db.query("select platforms.type_name as platform from devices, platforms where platforms.id = devices.platform_id && devices.id="+deviceID);
                    var platform = platforms[0].platform

                    var packet = {};

                    packet.id = deviceID;
                    packet.name = name;
                    packet.model = model;
                    packet.platform = platform;

                    devicesArray.push(packet);
                }

           }
           return devicesArray;

        }
    };
    // return module
    return module;
})();