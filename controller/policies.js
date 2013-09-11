var groupModule = require('/modules/group.js').group;
var group = new groupModule(db);

var featureModule = require('/modules/feature.js').feature;
var feature = new featureModule(db);

var policyModule = require('/modules/policy.js').policy;
var policy = new policyModule(db);


configuration = function(appController){	
	
	try{
		var policies = policy.getAllPolicies({});
	}catch(e){
		var policies = [];
	}
			
	try{
		var groups = group.getGroups({});
	}catch(e){
		var groups = [];
	}
	
	context = appController.context();
	context.jsFile= "policies/configuration.js";
	context.title = context.title + " | Configuration";		
	context.page = "configuration";
	context.data = {
			configOption : "policies",
			policies: policies,
			groups: groups
		
		}
	return context;
}


assign_groups = function(appController){	
	
	
	var policyId = request.getParameter('policy');
	var policyName = request.getParameter('policyName');
		
	try{
		var groups = group.getGroups({});		
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
		policyId: policyId,
		policyName: policyName
	}
	return context;
}



add = function(appController){	
	
	context = appController.context();
	
	
	try{
		var groups = group.getGroups({});		
	}catch(e){
		var groups = [];
	}
	
		
	try{
		var features =feature.getAllFeatures({});
	}catch(e){
		var features = [];
	}
	
	context.jsFile= "policies/add.js";
	context.title = context.title + " | Configuration";	
	context.page = "configuration";
	context.data = {
			configOption : "policies",
			groups: groups,
			features: features
	}
	return context;
}





add_bundle = function(appController){	
	
	context = appController.context();
		
	try{
		var groups = group.getGroups({});		
	}catch(e){
		var groups = [];
	}	
	
	try{
		var features = feature.getAllFeatures({});
	}catch(e){
		var features = [];
	}
	
	context.jsFile= "permissions/add_bundle.js";
	context.title = context.title + " | Configuration";	
	context.page = "configuration";
	context.data = {
			configOption : "permissions",
			groups: groups,
			features: features
	}
	return context;
}