var userModule = require('/modules/user.js').user;
var user = new userModule(db);

login = function(appController){	
	if(request.getMethod() == 'POST'){
		username = request.getParameter('username');
		password =  request.getParameter('password');
		var data = {'username': username, 'password': password};		
		var objUser = user.authenticate(data);

		if(objUser != null){
				response.status=200;
				var userAgent= request.getHeader("User-Agent");
			    var android = userAgent.indexOf("Android");
				//Fix this when Android client is resolved
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
					var isMasterAdmin = false;
					for (var i = 0; i < parsedRoles.length; i++) {
						if(parsedRoles[i] == 'admin') {
							isAdmin = true;
							break;
					}
						if(parsedRoles[i] == 'masteradmin') {
							isAdmin = true;
							isMasterAdmin = true;
							break;
						}
					}
					userFeed.isAdmin = isAdmin;
					userFeed.isMasterAdmin = isMasterAdmin;
					session.put("mdmConsoleUserLogin", "true");
					session.put("mdmConsoleUser", userFeed);
					if(isAdmin){
						response.sendRedirect('dashboard');
					}else{
						response.sendRedirect(appController.appInfo().server_url + 'users/devices?user=' + userFeed.username);
					}
				}
	    }else{
			response.status=401;
		    print("Authentication Failed");
		}
	}
	context = appController.context();
	context.title = context.title + " | Login";		
	context.data = {
		
	}
	return context;	

}
logout = function(appController){		
	session.put("mdmConsoleUserLogin", null);
	session.put("mdmConsoleUser", null);
	response.sendRedirect('login');
}

dashboard = function(appController){		
	context = appController.context();
	context.title = context.title + " | Dashboard";	
	context.jsFile= "console/dashboard.js";
	context.page = "dashboard";
	context.data = {		
	}
	return context;	
	
}
configuration = function(appController){	
	context = appController.context();
	context.title = context.title + " | Configuration";	
	context.page = "configuration";
	context.data = {
		configOption : "mdmsettings"		
	}
	return context;	
}
management = function(appController){		
	context = appController.context();
	context.title = context.title + " | Management";
	context.page = "management";	
	context.data = {
		
	}
	return context;	
	
}
info = function(appController){		
	print(session.get("mdmConsoleUser"));	
	return null;
}