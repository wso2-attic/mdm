var user = (function () {
	
    var module = function (db,router) {
		var userModule = require('/modules/user.js').user;
		var user = new userModule(db);
		
		router.post('users/authenticate/', function(ctx){

			var objUser = user.authenticate(ctx);

			if(objUser != null){
				//var devices = user.devices(obj);
				//If user category is admin or if normal user has devices allow login
					response.status=200;
					var userAgent= request.getHeader("User-Agent");
				    var android = userAgent.indexOf("Android");

				    if(android > 0){
						print("200");
					}else{
						var userFeed = {};
						userFeed.tenantId = stringify(objUser["um"]["tenantId"]);
						userFeed.username = objUser["username"];
						userFeed.email = objUser["email"];
						userFeed.firstName = objUser["firstName"];
						userFeed.lastName = objUser["lastName"];
						userFeed.mobile = objUser["mobile"];
						
						var parsedRoles = parse(objUser["roles"]);
						var isAdmin = false;
						
						for (var i = 0; i < parsedRoles.length; i++) {
							if(parsedRoles[i] == 'admin') {
								isAdmin = true;
								break;
							}
						}
						
						userFeed.isAdmin = isAdmin;var log = new Log();log.error("USER FEED " + stringify(userFeed));
						print(stringify(userFeed));
					}
					return;
		    }
			response.status=401;
		    print("Authentication Failed");
		});
		router.get('users/authenticate/', function(ctx){
			var obj = session.get("user");
			if(obj!=null){
		        print(obj);
				return;
			}
			response.status=401;
		    print("Authentication Failed");
		});
		router.get('users/unauthenicate/',function(ctx){
			session.put("user", null);
			response.status=200;
		});
		router.get('users/{userid}/sendmail',function(ctx){
			log.info('email sending to user');
			var u = user.getUser(ctx)[0];
			if(u!=null){
				user.sendEmail(u.username, u.first_name);
				log.info('Email sent to user with id '+u.username);
				return;
			}
			response.status = 404;
		    print("User not found");
		});
		router.get('users/{userid}',function(ctx){
			var log = new Log();
			var userObj = user.getUser(ctx)[0];
			
		    if(u!=null){
		       response.content = u;
		       response.status = 200;
		    }else{
		       response.status = 404;
		   	}
		});
		router.put('users/', function(ctx){
			var result = user.addUser(ctx);
			
		    if(result.error != null && result.error != undefined){
		    	response.status = 400;
		        print(result.error);
		    }else{
				response.status = 201;
				user.sendEmail(ctx);
		        print("User added Successful");
		    }
		});
		router.get('users/{userid}/groups/',function(ctx){
			var groups = user.getGroups(ctx);
		    if(groups[0]!= null){
		     	response.status = 200;
		       	response.content = groups;
		    }
		});
		router.get('users/',function(ctx){
			var obj = session.get("user");
			var log = new Log();
			
			var users= user.getUsers(ctx);
		    if(users[0] != null){
		        response.content = users;
		        response.status = 200;
		    }else{
		        response.status = 404;
		    }
		});
		router.get('users/{userid}/devices',function(ctx){
			var devices= user.devices(ctx);
		    if(devices[0]!=null){
		        response.content = devices;
		        response.status = 200;
		    }else{
		        response.status = 404;
		    }
		});
		router.post('users/{userid}/operations/{operation}',function(ctx){
			user.operation(ctx);
		});
    };
    // prototype
    module.prototype = {
        constructor: module
    };
    // return module
    return module;
})();