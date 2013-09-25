var userModule = require('/modules/user.js').user;
var user = new userModule(db);

var groupModule = require('/modules/group.js').group;
var group = new groupModule(db);

var deviceModule = require('/modules/device.js').device;
var device = new deviceModule(db);

var notificationModule = require('/modules/notification.js').notification;
var notification = new notificationModule(db);

configuration = function(appController) {
	context = appController.context();
	
	try {
        var users = user.getUsersByType({role:context.contextData.user.role});
	} catch(e) {		
		var users = [];
	}
	try {
		var groups = group.getGroups({});
	} catch(e) {
		log.info(e);
		var groups = [];
	}
	
	context.title = context.title + " | Configuration";
	context.page = "configuration";
	context.jsFile = "users/configuration.js"
	context.data = {
		configOption : "users",
		users : users,
		groups : groups
	}
	return context;
}


add = function(appController) {
	context = appController.context();

	try {
		var groups = group.getGroups({});
	} catch(e) {
		var groups = [];
	}
	
	// Array Remove - By John Resig (MIT Licensed)
	Array.prototype.remove = function(from, to) {
	  var rest = this.slice((to || from) + 1 || this.length);
	  this.length = from < 0 ? this.length + from : from;
	  return this.push.apply(this, rest);
	};

	if (context.contextData.user.role != 'masteradmin') {
		for (var i = 0; i < groups.length; i++) {
			if (groups[i] == 'masteradmin' | groups[i] == "admin") {
				groups.remove(i);
			}
		}
	}

	context.title = context.title + " | Add User";
	context.page = "configuration";
	context.jsFile = "users/add.js"
	context.data = {
		configOption : "users",
		groups : groups,
		tenantId : session.get("mdmConsoleUser").tenantId
	}
	return context;

}
edit = function(appController) {
	try {
		var groups = group.getGroups({});
	} catch(e) {
		var groups = [];
	}
	context = appController.context();
	context.title = context.title + " | Add User";
	context.page = "configuration";
	context.jsFile = "users/add.js"
	context.data = {
		configOption : "users",
		groups : groups
	}
	return context;

}
devices = function(appController) {
	
		
	log.info("Test devices >>>>>>>>");
	context = appController.context();
	var userId = request.getParameter('user');
	if (!userId) {
		userId = session.get('mdmConsoleSelectedUser');
	}
	session.put('mdmConsoleSelectedUser', userId)
	try {
		var objUser = user.getUser({
			"userid" : userId
		});
	} catch(e) {
		var objUser = {};
	}

	try {
		var devices = user.devices({
			"userid" : userId
		});
	} catch(e) {
		var devices = [];
	}

	for (var i = 0; i < devices.length; i++) {
		
		var allPolicies = notification.getPolicyState({deviceId: devices[i].id});
		var policyViolated = {violated : false};
		
		// this is a policy validation patch added to UI. since the backend filtering does not support.		
		policyViolated.policies = new Array();
		for(var j = 0; j <  allPolicies.length; j++){
			if(allPolicies[j].status){
				policyViolated.violated = true;
				policyViolated.policies.push(allPolicies[j]);
			}
		}
		//end of patch
		
		devices[i].policyViolated = policyViolated;
		
		devices[i].properties = JSON.parse(devices[i].properties);
		try {
			featureList = device.getFeaturesFromDevice({
				"deviceid" : devices[i].id, role:context.contextData.user.role
			});
			log.info("Feature List >>>>>>>>>>" + featureList);
		} catch(e) {
			featureList = [];
		}
		devices[i].features = featureList;
	}

	context.title = context.title + " | Add User";
	context.page = "management";
	context.jsFile = "users/devices.js"
	context.data = {
		configOption : "users",
		devices : devices,
		user : objUser
	}

	return context;

}
assign_groups = function(appController) {

	var username = request.getParameter('user');

	try {
		var groups = user.getRolesByUser({
			username : username
		});
	} catch(e) {
		var groups = [];
	}

	context = appController.context();
	
	// Array Remove - By John Resig (MIT Licensed)
	Array.prototype.remove = function(from, to) {
	  var rest = this.slice((to || from) + 1 || this.length);
	  this.length = from < 0 ? this.length + from : from;
	  return this.push.apply(this, rest);
	};
	
	
	if (context.contextData.user.role != 'masteradmin') {
		for (var i = 0; i < groups.length; i++) {
			if (groups[i].name == 'masteradmin' | groups[i].name == "admin") {
				groups.remove(i);
			}
		}
	}
	
	
	
	context.title = context.title + " | Assign Users to group";
	context.page = "configuration";
	context.jsFile = "users/assign_groups.js"
	context.data = {
		configOption : "policies",
		groups : groups,
		tenantId : session.get("mdmConsoleUser").tenantId,
		username : username

	}
	return context;
}