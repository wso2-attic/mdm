var TENANT_CONFIGS = 'tenant.configs';
var USER_MANAGER = 'user.manager';
var mam = (function () {
	var db;
	var carbon = require('carbon');
	var server = function(){
		return application.get("SERVER");
	}

	var configs = function (tenantId) {
	    var configg = application.get(TENANT_CONFIGS);
		if (!tenantId) {
	        return configg;
	    }
	    return configs[tenantId] || (configs[tenantId] = {});
	};
	/**
	 * Returns the user manager of the given tenant.
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
	    return configs(tenantId)[USER_MANAGER];
	};

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
		getInstallAppList: function(ctx){
            var array = [{'identity':'dummyidentity','type':'dumyvalue','os':'dumyos','name':'dumyname'}, {'identity':'dummyidentity','type':'dumyvalue','os':'dumyos','name':'dumyname'}, {'identity':'dummyidentity','type':'dumyvalue','os':'dumyos','name':'dumyname'}, {'identity':'dummyidentity','type':'dumyvalue','os':'dumyos','name':'dumyname'}];
            return array;
		}
    };

    // return module
    return module;
})();