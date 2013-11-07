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
            var array = [{'identity':'dummyidentity1','type':'dumyvalue1','os':'dumyos','name':'dumyname1'}, {'identity':'dummyidentity2','type':'dumyvalue2','os':'dumyos','name':'dumyname2'}, {'identity':'dummyidentity','type':'dumyvalue','os':'dumyos','name':'dumyname'}, {'identity':'dummyidentity','type':'dumyvalue','os':'dumyos','name':'dumyname'}];


            var url = "https://localhost:9443/store/apis/v1/assets/mobileapp";
            var data = {  };
          	var configs = require('config/mdm.js').config();
			var url  = configs.mam.store_location+"apis/assets/mobileapp";
			var data = get(url, {} ,"json");
            var result = data.data;
              var newArray = new Array();
              for(var i = 0; i<result.length; i++){
                var obj = {};
                obj.identity =result[i].attributes.overview_packagename;
                obj.type =  result[i].attributes.overview_type;
                obj.os = result[i].attributes.overview_platform;
                obj.name =  result[i].attributes.overview_name;
                newArray.push(obj);
              }
            return newArray;
		}
    };

    // return module
    return module;
})();