/*
Routing module will provide a way to route requests in many ways
TODO :- How to handle multipart data
*/
var goose = (function () {
    var configs = {
        CONTEXT: "/",
		CACHE:false,
		CACHE_REFRESH:false
    };
    // constructor
	// Will be using a hash rather than an array to access routes via hash
    var routes = {};
	var log = new Log();
	var route = function (route, action ,verb) {
        //contains VERB and the route
		if(configs.CACHE){
			if(routes[routeOverload(route+"|"+verb)]==undefined){
				routes[routeOverload(route+"|"+verb)] = {route:routeOverload(route),verb:verb,action:action};
				log.info("--------Goose CACHE enabled --------" + verb);
			}
			return;
		}
		routes[routeOverload(route+"|"+verb)] = {route:routeOverload(route),verb:verb,action:action};
    };
    var module = function (conf) {
        mergeRecursive(configs, conf);
		if(configs.CACHE){
			var r = application.get("jaggery.goose.routes");
			if(r==undefined){
				application.put("jaggery.goose.routes",routes);
			}else{
				routes=r;
			}
			route("cacherefresh",function(ctx){
				application.put("jaggery.goose.routes", undefined);
			}, "GET");
		}else{
			application.put("jaggery.goose.routes", undefined);
		}
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
        route: route,
		get: function (route, action) {
            this.route(route, action, "GET");
        },	
		post: function (route, action) {
            this.route(route, action, "POST");
	    },
		put: function (route, action) {
            this.route(route, action, "PUT");
	    },
		delete : function(route, action){
			this.route(route, action, "DELETE");
		},
        process: function (request) {
			var matched = false;
			for (var property in routes){
				if(routes.hasOwnProperty(property)){
					var routeObject = routes[property];
					//log.info(routeObject);
	                var routeAction = routeObject.action;
	                var route = routeObject.route;
	                var verb = routeObject.verb;
	                var uriMatcher = new URIMatcher(request.getRequestURI());
					//log.info(request.getRequestURI());
	                if (uriMatcher.match(route)) {
	                    // log.info('--------Goose Match--------');
	                }
	                if (uriMatcher.match(route) && request.getMethod() == verb) {
	                    var elements = uriMatcher.elements();
	                    var ctx = elements;
						// 	                    log.info("--------Goose Verb --------" + verb);
						// 	                    log.info("--------Goose Route --------" + route);
						// log.info("--------Goose Elements --------");
						// log.info(elements);

						var jResult = {};
						if(verb=="GET"){
							jResult = request.getAllParameters('UTF-8');
						}else{
							jResult = request.getAllParameters('UTF-8');
							if(request.getContentType().indexOf('application/json') !== -1){
								if(request.getContentType().indexOf('UTF-8') !== -1){
                                    log.info(request.getContentType());
                                    log.info(request.getContent());
                                    log.info(parse(request.getContent()));
									mergeRecursive(jResult, parse(request.getContent()));
								}else{
									mergeRecursive(jResult,request.getContent());
								}
							}
						}
						//log.info("--------Goose file parsing--------- ");
						ctx.files = request.getAllFiles();

						//log.info("--------Goose parsed data--------- ");
//						log.info(jResult);
	                    ctx = mergeRecursive(jResult,ctx);

						//log.info("--------Goose final data--------- ");
						//log.info(jResult);
	                    routeAction(ctx);
						matched = true;
	                    break;
	                }
				}
			}
			if(!matched){
				response.sendError(404);
			}
        }
    };
    // return module
    return module;
})();