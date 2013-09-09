var groupModule = require('/modules/group.js').group;
var group = new groupModule(db);

var webconsoleModule = require('/modules/webconsole.js').webconsole;
var webconsole = new webconsoleModule(db);

var featureModule = require('/modules/feature.js').feature;
var feature = new featureModule(db);

var userModule = require('/modules/user.js').user;
var user = new userModule(db);

var deviceModule = require('/modules/device.js').device;
var device = new deviceModule(db);

configuration = function(appController){	
	
	try{
		var groups = group.getGroups({});
	}catch(e){
		var groups = [];
	}
			
	context = appController.context();
	context.title = context.title + " | Configuration";	
	context.page = "configuration";
	context.jsFile= "roles/configuration.js";
	context.data = {
		configOption : "roles",
		groups : groups
	}
	return context;	
	
}


management = function(appController){
	
	context = appController.context();	
	var groups;
	try{
		groups = webconsole.getDevicesCountAndUserCountForAllGroups({});
	}catch(e){
		groups = [];
	}
	var features
	try{
		features =feature.getAllFeatures({});
	}catch(e){
		 features = [];
	}

	context.title = context.title + " | Management";	
	context.page = "management";
	context.jsFile= "roles/management.js";
	context.data = {
		configOption : "roles",
		groups: groups,
		features: features,
		tenantId:session.get("mdmConsoleUser").tenantId		
	}
	return context;	
	
}


users = function(appController){	
	context = appController.context();
	var role = request.getParameter('role');
	if(!role){
		role = session.get('mdmConsoleSelectedRole');
	}
	session.put('mdmConsoleSelectedRole', role)
	try{
		var users = group.getUsers({'groupid':role});
	}catch(e){
		var users = [];
	}
	for (var i = 0; i < users.length; i++) {
		
		if(users[i].no_of_devices > 0){
			var devices = user.devices({'userid':users[i].userid});
			
			for (var j = 0; j < devices.length; j++) {  		
		  		devices[j].properties = JSON.parse(devices[j].properties);    		
		  		try{
		  			featureList = device.getFeaturesFromDevice({"deviceid":devices[j].id});
		  		}catch(e){
		  			featureList = [];
		  		}  		 
		  		devices[j].features = featureList;  			
		  			
			}

			users[i].devices = devices;
		}
		
	}
	var features = feature.getAllFeatures({});
	context.title = context.title + " | Users";	
	context.page = "management";
	context.jsFile= "roles/users.js";
	context.data = {
		configOption : "roles",
		users: users,
		features: features	
	}
	return context;	
	
}


add = function(appController){	
	try{
		var users = user.getUsers({});
	}catch(e){
		var users = [];
	}
	log.info("sdfsd");
	log.info(session.get("mdmConsoleUser"));
	context = appController.context();
	context.title = context.title + " | Add Group";	
	context.page = "configuration";	
	context.jsFile= "roles/add.js"
	context.data = {
		configOption : "roles",
		users: users,
		tenantId:session.get("mdmConsoleUser").tenantId
	}
	return context;
}


