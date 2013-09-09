var sample = (function () {
    var configs = {
        CONTEXT: "/"
    };
    // constructor
    var routes = new Array();
	var log = new Log();
	var db;
    var module = function (dbs) {
		db = dbs;
        //mergeRecursive(configs, conf);
    };

    function routeOverload(route) {
        return configs.CONTEXT + route;
    }

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
        route: function (route, action) {
            //contains VERB and the route
            routes.push({
                    route: routeOverload(route),
                    action: action
                });
        },
		get: function (route, action) {
            this.route(route + "|GET", action);
        },	
		post: function (route, action) {
            this.route(route + "|POST", action);
	    },
		put: function (route, action) {
            this.route(route + "|PUT", action);
	    },
        process: function (request) {
            
        }
    };
    // return module
    return module;
})();