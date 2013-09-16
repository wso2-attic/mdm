var TENANT_CONFIGS = 'tenant.configs';
var USER_MANAGER = 'user.manager';
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
    var server = function(){
        return application.get("SERVER");
    }
	var common = require('common.js');


    var configs = function (tenantId) {
        var config = application.get(TENANT_CONFIGS);
        if (!tenantId) {
            return config;
        }
        return config[tenantId] || (config[tenantId] = {});
    };

    var userManager = function (tenantId) {
        var config = configs(tenantId);
        if (!config || !config[USER_MANAGER]) {
            var um = new carbon.user.UserManager(server, tenantId);
            config[USER_MANAGER] = um;
            return um;
        }
        return configs(tenantId)[USER_MANAGER];
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
        getDevicesCountAndUserCountForAllGroups: function(ctx) {
        	var um = userManager(common.getTenantID());
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
            log.info(arrRole);
            return arrRole;
        }
    };
    return module;
})();