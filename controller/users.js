var userGModule = require('/modules/user_group.js').user_group;
var userG = new userGModule(db);

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
        var users = user.getUsersByType({type:context.contextData.user.role});
        log.info("Users >>>>>>>"+stringify(users));
	} catch(e) {
		log.info(e);
		var users = [];
	}
	try {
		var groups = group.getAllGroups({});
	} catch(e) {
		log.info(e);
		var groups = [];
	}
	
	context.title = context.title + " | Configuration";
	context.page = "configuration";
	context.jsFile = "users/configuration.js";
	context.data = {
		configOption : "users",
		users : users,
		groups : groups
	};
	return context;
};


add = function(appController) {
	context = appController.context();

	try {
		var groups = group.getGroupsByType({type:context.contextData.user.role});		
	} catch(e) {
      //  print(group.getGroupsByType({type:context.contextData.user.role}));
		var groups = [];
	}
   // print(stringify(groups));

	context.title = context.title + " | Add User";
	context.page = "configuration";
	context.jsFile = "users/add.js";
	context.data = {
		configOption : "users",
		groups : groups,
		tenantId : session.get("mdmConsoleUser").tenantId
	};
	return context;

};


edit = function(appController) {
	try {
		var groups = group.getGroups({});
	} catch(e) {
		var groups = [];
	}
	context = appController.context();
	context.title = context.title + " | Add User";
	context.page = "configuration";
	context.jsFile = "users/add.js";
	context.data = {
		configOption : "users",
		groups : groups
	};
	return context;

};


view = function(appController) {
	context = appController.context();
	var userId = request.getParameter('user');
	if (!userId) {
		userId = session.get('mdmConsoleSelectedUser');
	}
	session.put('mdmConsoleSelectedUser', userId);
	try {
		var objUser = user.getUser({
			"userid" : userId
		});
	} catch(e) {
		var objUser = {};
	}
	
	
	try {
		var groups = userG.getRolesOfUserByAssignment({
			username : userId
		});
	} catch(e) {       
		var groups = [];
	}
	
		
	context.title = context.title + " | View User";
	context.page = "configuration";	
	context.data = {
		user: objUser,
		groups: groups
	};
	return context;

};

devices = function(appController) {
	
		
	log.info("Test devices >>>>>>>>");
	context = appController.context();
	var userId = request.getParameter('user');
	if (!userId) {
		userId = session.get('mdmConsoleSelectedUser');
	}
	session.put('mdmConsoleSelectedUser', userId);
	try {
		var objUser = user.getUser({
			"userid" : userId
		});
	} catch(e) {
		var objUser = {};
	}

	try {
		var devices = user.getDevices({
			"userid" : userId
		});
	} catch(e) {
		var devices = [];
	}
	
	if(devices.length <= 0){
		noDevices = true;
	}else{
		noDevices = false;
	}

	for (var i = 0; i < devices.length; i++) {
		
		
		/*try{
			var appList = notification.getLastRecord({deviceid: devices[i].id , operation: "502A"}).received_data;
			devices[i].appList = parse(appList);
		}catch(e){
			devices[i].appList = [];
		}*/
		
		try {		
				var allPolicies = notification.getPolicyState({deviceid: devices[i].id});
				if(!allPolicies.length > 0){
					allPolicies = new Array();
				}
				var policies = {violated : false, policies: allPolicies};
				
				// this is a policy validation patch added to UI. since the backend filtering does not support.		
				
				for(var j = 0; j <  allPolicies.length; j++){
					if(!allPolicies[j].status){
						policies.violated = true;						
					}
				}
				//end of patch
				devices[i].policies = policies;	
				
				
		} catch(e) {
				
		}
		
	
		
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
	context.jsFile = "users/devices.js";
	context.googleMaps = true;
	context.data = {
		configOption : "users",
		devices : devices,
		user : objUser,
		noDevices: noDevices
	};

	return context;

};


assign_groups = function(appController) {

	var username = request.getParameter('user');

	try {
		var groups = userG.getRolesOfUserByAssignment({
			username : username
		});
	} catch(e) {
        print(userG.getRolesOfUserByAssignment({username : username}));
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
	context.jsFile = "users/assign_groups.js";
	context.data = {
		configOption : "policies",
		groups : groups,
		tenantId : session.get("mdmConsoleUser").tenantId,
		username : username

	};
	return context;
};