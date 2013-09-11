var userModule = require('/modules/user.js').user;
var user = new userModule(db);

var groupModule = require('/modules/group.js').group;
var group = new groupModule(db);

var deviceModule = require('/modules/device.js').device;
var device = new deviceModule(db);

configuration = function(appController){	
	try{
		var users = user.getUsers({});
	}catch(e){
		var users = [];
	}
	try{
		var groups = group.getGroups({});
	}catch(e){
		var groups = [];
	}
	context = appController.context();
	context.title = context.title + " | Configuration";	
	context.page = "configuration";
	context.jsFile= "users/configuration.js"
	context.data = {
		configOption : "users",
		users: users,
		groups: groups		
	}
	return context;	
}


add = function(appController){		
	try{
		var groups = group.getGroups({});
	}catch(e){
		var groups = [];
	}
			
	context = appController.context();
	context.title = context.title + " | Add User";	
	context.page = "configuration";	
	context.jsFile= "users/add.js"
	context.data = {
		configOption : "users",
		groups: groups,
		tenantId: session.get("mdmConsoleUser").tenantId
	}
	return context;	
	
}


edit = function(appController){	
	try{
		var groups = group.getGroups({});
	}catch(e){
		var groups = [];
	}		
	context = appController.context();
	context.title = context.title + " | Add User";	
	context.page = "configuration";	
	context.jsFile= "users/add.js"
	context.data = {
		configOption : "users",
		groups: groups
	}
	return context;	
	
}


devices = function(appController){
    log.info("Test devices >>>>>>>>");
	context = appController.context();	
	var userId = request.getParameter('user');
	if(!userId){
		userId = session.get('mdmConsoleSelectedUser');
	}
	session.put('mdmConsoleSelectedUser', userId)
	try{
		var objUser = user.getUser({"userid":userId});	
	}catch(e){
		var objUser = {};
	}
	
	try{
		var devices = user.devices({"userid":userId});
	}catch(e){
		var devices = [];
	}

 	for (var i = 0; i < devices.length; i++) {  		
  		devices[i].properties = JSON.parse(devices[i].properties);    		
  		try{
  			featureList = device.getFeaturesFromDevice({"deviceid":devices[i].id});
            log.info("Feature List >>>>>>>>>>"+featureList);
  		}catch(e){
  			featureList = [];
  		}  		 
  		devices[i].features = featureList;  			
	}

	context.title = context.title + " | Add User";	
	context.page = "management";
	context.jsFile = "users/devices.js"	
	context.data = {
		configOption : "users",
		devices: devices,
		user: objUser		
	}
		
	return context;	
	
}


assign_groups = function(appController){	
	
	
	var username = request.getParameter('username');
		
	try{
		var groups = policy.getGroups({});		
	}catch(e){
		var groups = [];
	}
	
				
	context = appController.context();
	context.title = context.title + " | Assign Users to group";	
	context.page = "configuration";	
	context.jsFile= "policies/assign_groups.js"
	context.data = {
		configOption : "policies",
		groups: groups,
		tenantId:session.get("mdmConsoleUser").tenantId,
		username: username
		
	}
	return context;
}