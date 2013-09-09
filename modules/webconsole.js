var webconsole = (function () {
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
    var carbon = require('carbon');
	var server = new carbon.server.Server(configs.HTTPS_URL + '/admin');
	var common = require('common.js');

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
        getDevicesCountAndUserCountForAllGroups: function(ctx) {
        	var um = new carbon.user.UserManager(server, server.getDomainByTenantId(common.getTenantID()));
        	var roles =  um.allRoles();
			
			var arrRole = new Array();
			
			for(var i = 0; i < roles.length; i++) {
				
				if(!common.isMDMRole(roles[i])) {
					continue;
				}
				
				var objRole = {};
				objRole.name =  String(roles[i]);
				
				var userList = um.getUserListOfRole(roles[i]);
				objRole.no_of_users = userList.length;
				
				var deviceCountAll = 0;
				
				for(var j = 0; j < userList.length; j++) {
					var resultDeviceCount = db.query("SELECT COUNT(id) AS device_count FROM devices WHERE user_id = ? AND tenant_id = ?", 
						String(userList[j]), common.getTenantID());
					deviceCountAll += parseInt(resultDeviceCount[0].device_count);
				}
				objRole.no_of_devices = deviceCountAll;

				arrRole.push(objRole);
			}

            return arrRole;
        }
    };
    return module;
})();