var Handle = require("/modules/handlebars.js").Handlebars;
var mvc = (function () {
	var configs= {
		SERVER_URL: "/",
		ENGINE: "hbs"
	};
	var log;
	var module = function (cf) {
		mergeRecursive(configs,cf);
		log= new Log();
		registerPartials();
    };
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
	function getResource(name){
		var f = new File(name);
		f.open("r");
		var cont = f.readAll();
		f.close();
		return cont;
	}
	
	function isExists(filename){
		var f = new File(filename);
		return f.isExists();
	}
	function isImage(mime){
		switch (mime) {
	        case 'image/png':
	            return true;
	        case 'image/gif':
	            return true;
	        case 'image/jpeg':
	            return true;
	        case 'image/jpg':
	            return true;
			case 'application/vnd.android.package-archive':
				return true;
	    }
	}
	function routeAsset(resourceURL){
		//log.info("Resource URL"+resourceURL);
		var m = mime(resourceURL);
		response.addHeader('Content-Type', m);
		if(isImage(m)){
			var f = new File(resourceURL);
			f.open('r');
		    print(f.getStream());
		}else{
			print(getResource(resourceURL));
		}
	}
	//Register all the partials in the views/partial directory
    function registerPartials(){
        var f = new File("/views/partials");
        var partials = f.listFiles();
        for (var i=0; i<partials.length; i++){
            var partial = partials[i];
            partial.open('r');
            Handle.registerPartial(partial.getName().split('.')[0], partial.readAll());
            partial.close();
// log.info("Handle registered template -"+partial.getName().split('.')[0]);
        }
    }
	
	//If the path has a . return true
	function isAsset(path){
		return path.indexOf(".")!=-1
	}
	function mime(path){
		var index = path.lastIndexOf('.');
	    var ext = index < path.length ? path.substring(index + 1) : '';
	    switch (ext) {
	        case 'js':
	            return 'application/javascript';
	        case 'css':
	            return 'text/css';
	        case 'html':
	            return 'text/html';
	        case 'png':
	            return 'image/png';
	        case 'gif':
	            return 'image/gif';
	        case 'jpeg':
	            return 'image/jpeg';
	        case 'jpg':
	            return 'image/jpg';
	        case 'apk':
	            return 'application/vnd.android.package-archive';
			default:
				return 'text/plain';
	    }
	}
	//Call
	function callAPI(request){
		//log.info("Router process ");
		configs.ROUTER.process(request);
	}
	//Check if API route is provided and 
	//if the current call is for the API
	function isAPI(pageParams){
		if(configs.API==undefined){
			return false;
		}
		// log.info("K "+pageParams[0]);
		return pageParams[0]== configs.API;
	}
	// prototype
    module.prototype = {
        constructor: module,
        route: function (req) {
			var reqURL = req.getRequestURI();
			var pageURL = reqURL.replace(configs.SERVER_URL, '');
			//Ignore the specified URIs
			for (var i=0; i < configs.IGNORE.length; i++) {
				if(pageURL==configs.IGNORE[i]){
					include(pageURL);
					return;
				} 
			};
			
			// log.info("Request url: "+reqURL);
			// log.info("Page url: "+pageURL);
			
			var pageParams = pageURL.split('/');
			
			if(isAPI(pageParams)){
				callAPI(req);
				return;
			}
			//Send the last part of the uri 
			//Routing assets
			if(isAsset(pageParams[pageParams.length-1])){
				routeAsset(pageURL);
				return;
			}
			
			var controller = pageParams[0];
			var view = "index";
			if(pageParams.length>1 && pageParams[1]!=''){
				view = pageParams[1];	
			}
			var viewName = view;
			view = view+"."+configs.ENGINE;
			//log.info("View "+ view);
			
			//App controller
			var appController;
			if(isExists('/controller/app.js')){
				appController =require('/controller/app.js');
			}
			
			//Extracting the template from the view
			var template;
			var templateURI = '/views/'+controller+"/"+view;
			if(isExists(templateURI)){
				template = Handle.compile(getResource(templateURI));
			}
			
			var context;
			//If controller is empty the request is for the app index page
			if(controller==''){
				if(appController.index!=undefined){
					context = appController.index();	
				}
			}
			if(isExists('/controller/'+controller+".js") && require('/controller/'+controller+".js")[viewName] !=undefined){
				context = require('/controller/'+controller+".js")[viewName](appController);
				//log.info("Current context "+context);
			}		
			//Extracting the layout from the controller
			var layout;
			if(context!=undefined && context.layout!=undefined){
				layout = Handle.compile(getResource("/pages/"+context.layout+".hbs"));
			}
			//If we can't find a controller as well as a view we are sending a 404 error
			if(template==undefined && context==undefined){
				try{
					response.sendError(404);
				}catch (e) {
					new Log().debug(e);
				}
			}else{
				var b = template(context);
				if(layout==undefined){
					//If the controller hasn't specified a layout
					print(b);
				}else{
					//Now mixing the controller context with generated body template
					print(layout(mergeRecursive({body:b}, context)));
				}
			}
        },
		registerHelper: function(helperName, helperFunction){
			Handle.registerHelper(helperName, helperFunction);
		},
		registerPartial: function(partialName, partial){
			Handle.registerPartial(partialName,partial);
		}
    };
// return module
    return module;
})();
