var dashboard = (function () {
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
        getAllDevices: function(ctx){
            var result1 = db.query("SELECT platforms.type_name as name, ROUND((count(devices.id)/(select count(id) from devices))*100,0) as y from platforms, devices where devices.platform_id = platforms.id group by type");
            var finalResult = {};
            finalResult.count=result1;

            var array = new Array();

            var byodCount = db.query("select round((count(id)/(select count(id) from devices))*100,0) as byodCount from devices where byod=1");
            var obj1 = {};
            obj1.name = "BYOD";
            //obj1.color = "#F17C37";
            obj1.y = byodCount[0].byodCount;
            array.push(obj1);

            var ownCount = db.query("select round((count(id)/(select count(id) from devices))*100,0) as ownCount from devices where byod=0");
            var obj2 = {};
            obj2.name = "Cooperate";
            //obj2.color = "#F17C37";
            obj2.y = ownCount[0].ownCount;
            array.push(obj2);

            finalResult.ownership=array;

            return finalResult;
        },getAllAndroidDevices: function(ctx){

            var finalResult = {};

            var array = new Array();

            var byodCountAndroid = db.query("select round((count(devices.id)/(select count(devices.id) from devices,platforms where devices.platform_id = platforms.id && platforms.type = 1))*100,0) as byodCountAndroid from devices, platforms where devices.byod = 1 && devices.platform_id = platforms.id && platforms.type = 1");
            var byodAndroid = byodCountAndroid[0].byodCountAndroid;
            if(byodAndroid == null){
                byodAndroid = 0;
            }

            var obj1 = {};
            obj1.name = "BYOD";
            //obj1.color = "#F17C37";
            obj1.y = byodAndroid;
            array.push(obj1);

            var ownCountAndroid = db.query("select round((count(devices.id)/(select count(devices.id) from devices,platforms where devices.platform_id = platforms.id && platforms.type = 1))*100,0) as ownCountAndroid from devices, platforms where devices.byod = 0 && devices.platform_id = platforms.id && platforms.type = 1");
            var nonByodAndroid = ownCountAndroid[0].ownCountAndroid;
            if(nonByodAndroid == null){
                nonByodAndroid = 0;
            }
            var obj2 = {};
            obj2.name = "Cooperate";
            //obj2.color = "#F17C37";
            obj2.y = nonByodAndroid;
            array.push(obj2);

            finalResult.ownership=array;

            var Androidversions = db.query("select os_version as name, round((count(devices.id)/(select count(devices.id) from devices,platforms where devices.platform_id = platforms.id && platforms.type = 1 ))*100,0) as y from devices, platforms  where devices.platform_id = platforms.id && platforms.type = 1  group by os_version");

            finalResult.versions = Androidversions;

            return finalResult;
        },getAlliOSDevices: function(ctx){

            var finalResult = {};

            var array = new Array();

            var byodCountAndroid = db.query("select round((count(devices.id)/(select count(devices.id) from devices,platforms where devices.platform_id = platforms.id && platforms.type = 1))*100,0) as byodCountAndroid from devices, platforms where devices.byod = 1 && devices.platform_id = platforms.id && platforms.type = 2");
            var byodAndroid = byodCountAndroid[0].byodCountAndroid;
            if(byodAndroid == null){
                byodAndroid = 0;
            }

            var obj1 = {};
            obj1.name = "BYOD";
            //obj1.color = "#F17C37";
            obj1.y = byodAndroid;
            array.push(obj1);

            var ownCountAndroid = db.query("select round((count(devices.id)/(select count(devices.id) from devices,platforms where devices.platform_id = platforms.id && platforms.type = 1))*100,0) as ownCountAndroid from devices, platforms where devices.byod = 0 && devices.platform_id = platforms.id && platforms.type = 2");
            var nonByodAndroid = ownCountAndroid[0].ownCountAndroid;
            if(nonByodAndroid == null){
                nonByodAndroid = 0;
            }
            var obj2 = {};
            obj2.name = "Cooperate";
            //obj2.color = "#F17C37";
            obj2.y = nonByodAndroid;
            array.push(obj2);

            finalResult.ownership=array;

            var Androidversions = db.query("select os_version as name, round((count(devices.id)/(select count(devices.id) from devices,platforms where devices.platform_id = platforms.id && platforms.type = 1 ))*100,0) as y from devices, platforms  where devices.platform_id = platforms.id && platforms.type = 2  group by os_version");

            finalResult.versions = Androidversions;

            return finalResult;
        },getDashboardInfo: function(ctx){        	
        	
        	
        	 var resultOS = db.query("SELECT Platforms.type, COUNT(Devices.id) AS count FROM Platforms, Devices WHERE Platforms.id=Devices.platform_id GROUP BY Platforms.type");
             var androidCount = 0;
             var iosCount = 0;
             var winCount = 0;
             if(resultOS[0] != null){
                 androidCount = resultOS[0].count;
             }
             if(resultOS[1] != null){
                 iosCount = resultOS[1].count;
             }
             if(resultOS[2] != null){
                 winCount = resultOS[2].count;
             }
             var totalCount = parseInt(androidCount) + parseInt(iosCount) + parseInt(winCount);
             var resultVer = db.query("SELECT Platforms.type, Devices.os_version, COUNT(Devices.id) AS count FROM Platforms, Devices where Platforms.id=Devices.platform_id GROUP BY Devices.os_version");
             var androidVersions={};
             var iOSVersions={};
             var winVersions={};
             var verCountAndroid = 0;
             var verCountIos = 0;
             var verCountWindows = 0;
             for(var i=0; i<resultVer.length; i++){
                 if(resultVer[i].type == 1){
                     verCountAndroid += parseInt(resultVer[i].count);
                 }

                 if(resultVer[i].type == 2){
                     verCountIos += parseInt(resultVer[i].count);
                 }

                 if(resultVer[i].type == 3){
                     verCountWindows += parseInt(resultVer[i].count);
                 }
             }
             for(var i=0; i<resultVer.length; i++){
                 if(resultVer[i].type == 1){
                     androidVersions[resultVer[i].os_version] = [(parseInt(resultVer[i].count)/parseInt(verCountAndroid)*100), parseInt(resultVer[i].count)];
                 }

                 if(resultVer[i].type == 2){
                     iOSVersions[resultVer[i].os_version] = [(parseInt(resultVer[i].count)/parseInt(verCountIos)*100), parseInt(resultVer[i].count)];
                 }

                 if(resultVer[i].type == 3){
                     winVersions[resultVer[i].os_version] = [(parseInt(resultVer[i].count)/parseInt(verCountWindows)*100), parseInt(resultVer[i].count)];
                 }
             }
             var resultType = db.query("SELECT Platforms.type, Platforms.name, count(Devices.id) AS count FROM Platforms, Devices WHERE Platforms.id=Devices.platform_id GROUP BY Platforms.name");
             var androidTypes={};
             var iOSTypes={};
             var winTypes={};
             var typeCountAndroid = 0;
             var typeCountIos = 0;
             var typeCountWindows = 0;

             for(var i=0; i<resultType.length; i++){

                 if(resultType[i].type == 1){
                     typeCountAndroid += parseInt(resultType[i].count);
                 }

                 if(resultType[i].type == 2){
                     typeCountIos += parseInt(resultType[i].count);
                 }

                 if(resultType[i].type == 3){
                     typeCountWindows += parseInt(resultType[i].count);
                 }
             }
             for(var i=0; i<resultType.length; i++){
                 if(resultType[i].type == 1){
                     androidTypes[resultType[i].name] = [(parseInt(resultType[i].count)/parseInt(typeCountAndroid)*100), parseInt(resultType[i].count)];
                 }

                 if(resultType[i].type == 2){
                     iOSTypes[resultType[i].name] = [(parseInt(resultType[i].count)/parseInt(typeCountIos)*100), parseInt(resultType[i].count)];
                 }

                 if(resultType[i].type == 3){
                     winTypes[resultType[i].name] = [(parseInt(resultType[i].count)/parseInt(typeCountWindows)*100), parseInt(resultType[i].count)];
                 }
             }


             var resultByod = db.query("SELECT p.type, SUM(d.byod=1) AS byod, SUM(d.byod=0) AS non_byod FROM Platforms AS p JOIN Devices d ON p.id=d.platform_id GROUP BY p.type ASC");
             var androidBYOD={};
             var iOSBYOD={};
             var winBYOD={};
             var byodCountAndroid = 0;
             var byodCountIos = 0;
             var byodCountWindows = 0;
             for(var i=0; i<resultByod.length; i++){
                 if(resultByod[i].type == 1){
                     byodCountAndroid += (parseInt(resultByod[i].byod) + parseInt(resultByod[i].non_byod));
                 }

                 if(resultByod[i].type == 2){
                     byodCountIos += (parseInt(resultByod[i].byod) + parseInt(resultByod[i].non_byod));
                 }

                 if(resultByod[i].type == 3){
                     byodCountWindows += (parseInt(resultByod[i].byod) + parseInt(resultByod[i].non_byod));
                 }
             }
             for(var i=0; i<resultByod.length; i++){
                 if(resultByod[i].type == 1){
                     androidBYOD["Personal"] = [(parseInt(resultByod[i].byod)/parseInt(byodCountAndroid)*100), parseInt(resultByod[i].byod)];
                     androidBYOD["Corporate"] = [(parseInt(resultByod[i].non_byod)/parseInt(byodCountAndroid)*100), parseInt(resultByod[i].non_byod)];
                 }

                 if(resultByod[i].type == 2){
                     iOSBYOD["Personal"] = [(parseInt(resultByod[i].byod)/parseInt(byodCountIos)*100),parseInt(resultByod[i].byod) ];
                     iOSBYOD["Corporate"] = [(parseInt(resultByod[i].non_byod)/parseInt(byodCountIos)*100), parseInt(resultByod[i].non_byod)];
                 }

                 if(resultByod[i].type == 3){
                     winBYOD["Personal"] = [(parseInt(resultByod[i].byod)/parseInt(byodCountWindows)*100), parseInt(resultByod[i].byod)];
                     winBYOD["Corporate"] = [(parseInt(resultByod[i].non_byod)/parseInt(byodCountWindows)*100), parseInt(resultByod[i].non_byod)];
                 }
             }
             /*var resultOnline = db.query("SELECT p.type, SUM(d.online=1) AS online, SUM(d.online=2) AS offline FROM Platforms AS p JOIN Devices d ON p.id=d.platform_id GROUP BY p.type ASC");
             var androidOnline={};
             var iOSOnline={};
             var winOnline={};
             var onlineAndroidCount = 0;
             var onlineIosCount = 0;
             var onlineWindowsCount = 0;
             for(var i=0; i<resultOnline.length; i++){
                 if(resultOnline[i].type == 1){
                     onlineAndroidCount += (parseInt(resultOnline[i].online) + parseInt(resultOnline[i].offline));
                 }

                 if(resultOnline[i].type == 2){
                     onlineIosCount += (parseInt(resultOnline[i].online) + parseInt(resultOnline[i].offline));
                 }

                 if(resultOnline[i].type == 3){
                     onlineWindowsCount += (parseInt(resultOnline[i].online) + parseInt(resultOnline[i].offline));
                 }
             }
             for(var i=0; i<resultOnline.length; i++){
                 if(resultOnline[i].type == 1){
                     androidOnline["online"] = [(parseInt(resultOnline[i].online)/parseInt(onlineAndroidCount)*100), parseInt(resultOnline[i].online)];
                     androidOnline["offline"] = [(parseInt(resultOnline[i].offline)/parseInt(onlineAndroidCount)*100), parseInt(resultOnline[i].offline)];
                 }

                 if(resultOnline[i].type == 2){
                     iOSOnline["online"] = [(parseInt(resultOnline[i].online)/parseInt(onlineIosCount)*100), parseInt(resultOnline[i].online)];
                     iOSOnline["offline"] = [(parseInt(resultOnline[i].offline)/parseInt(onlineIosCount)*100), parseInt(resultOnline[i].offline)];
                 }

                 if(resultOnline[i].type == 3){
                     winOnline["online"] = [(parseInt(resultOnline[i].online)/parseInt(onlineWindowsCount)*100), parseInt(resultOnline[i].online)];
                     winOnline["offline"] = [(parseInt(resultOnline[i].offline)/parseInt(onlineWindowsCount)*100), parseInt(resultOnline[i].offline)];
                 }
             }*/

     		var androidOnline={};
     		androidOnline["online"] = 75;
     		androidOnline["offline"] = 25;
             var iOSOnline={};
             iOSOnline["online"] = 50;
             iOSOnline["offline"] = 50;
             var winOnline={};
             winOnline["online"] = 0;
             winOnline["offline"] = 0;
             
             
             var resultVendor = db.query("SELECT Platforms.type, Devices.vendor, COUNT(Devices.id) AS count FROM Platforms, Devices where Platforms.id=Devices.platform_id GROUP BY Devices.vendor");
             var androidVendors={};
             var iOSVendors={};
             var winVendors={};
             var vendorCountAndroid = 0;
             var vendorCountIos = 0;
             var vendorCountWindows = 0;

             for(var i=0; i<resultVendor.length; i++){

                 if(resultVendor[i].type == 1){
                     vendorCountAndroid += parseInt(resultVendor[i].count);
                 }

                 if(resultVendor[i].type == 2){
                     vendorCountIos += parseInt(resultVendor[i].count);
                 }

                 if(resultVendor[i].type == 3){
                     vendorCountWindows += parseInt(resultVendor[i].count);
                 }
             }
             for(var i=0; i<resultVendor.length; i++){
                 if(resultVendor[i].type == 1){
                     androidVendors[resultVendor[i].vendor] = [(parseInt(resultVendor[i].count)/parseInt(vendorCountAndroid)*100), parseInt(resultVendor[i].count)];
                 }

                 if(resultVendor[i].type == 2){
                     iOSVendors[resultVendor[i].vendor] = [(parseInt(resultVendor[i].count)/parseInt(vendorCountIos)*100), parseInt(resultVendor[i].count)];
                 }

                 if(resultVendor[i].type == 3){
                     winVendors[resultVendor[i].vendor] = [(parseInt(resultVendor[i].count)/parseInt(vendorCountWindows)*100), parseInt(resultVendor[i].count)];
                 }
             }
             
             var obj={};
             var android = null;
             android = {
                 Version : androidVersions,
                 Vendor : androidVendors,
                 Ownership : androidBYOD
             };

             var iOS = null;
             iOS = {
                 Version : iOSVersions,
                 Type : iOSTypes,
                 Ownership : iOSBYOD
             };

             var windows = null;
             windows = {
                 Version : winVersions,
                 Vendor : winVendors,
                 Type : winTypes,
                 Ownership : winBYOD
             };


             obj["Android"] = {percentage : [((parseInt(androidCount)/parseInt(totalCount))*100), parseInt(androidCount)], data : android};
             obj["iOS"] = {percentage : [((parseInt(iosCount)/parseInt(totalCount))*100), parseInt(iosCount)], data : iOS};
             obj["Windows"] = {percentage : [((parseInt(winCount)/parseInt(totalCount))*100), parseInt(winCount)], data : windows};

             return obj;
        	
        }
    };
    return module;
})();

