var Jally = (function () {
	var context;
    // constructor
	var routes = new Array();
    var module = function (ctx) {
		log.info("Jally Context- "+ctx);
		context=ctx;
    };
	function routeOverload(route){
		return context+route;
	}
	function mergeRecursive(obj1, obj2) {
	  for (var p in obj2) {
	    try {
	      // Property in destination object set; update its value.
	      if ( obj2[p].constructor==Object ) {
	        obj1[p] = MergeRecursive(obj1[p], obj2[p]);
	      } else {
	        obj1[p] = obj2[p];
	      }
	    } catch(e) {
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
			routes.push({route:routeOverload(route),action:action});
        },
		process: function(request){
			for (var i = 0; i < routes.length; i++) {
			    var routeObject = routes[i];
				var routeAction = routeObject.action;
				var routeVariables = routeObject.route.split("|");
				var route = routeVariables[0];
				var verb = routeVariables[1];
				var uriMatcher = new URIMatcher(request.getRequestURI());
				log.info(route+"   "+request.getRequestURI());
				if(uriMatcher.match(route)){
					log.info('Match');
				}
				
				if(uriMatcher.match(route)&&request.getMethod()==verb){
					var elements = uriMatcher.elements();
					var ctx = elements;
					log.info("Jally Verb -"+verb);
					log.info("Jally Route -"+route);
					if(verb!='GET'){
						var jResult = request.getContent();
						log.info("Jally data - "+jResult);
						log.info('Jally String parameters -'+request.getParameter('username'));
						try{
							jResult = parse(jResult);
						}catch(err){
							jResult = request.getAllParameters();
						}
						ctx = mergeRecursive(ctx, jResult);
					}
					routeAction(ctx);
					break;
				}
			}
		}
    };
// return module
    return module;
})();