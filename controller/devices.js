var featureModule = require('/modules/feature.js').feature;
var feature = new featureModule(db);




management = function(appController){   
	context = appController.context();	
	
	
	
	var features
	try{
		features =feature.getAllFeatures({});
	}catch(e){
		 features = [];
	}
		

	context.title = context.title + " |  Devices Management";
	context.page = "management";
	context.jsFile= "devices/management.js";
	context.data = {		
		tenantId:session.get("mdmConsoleUser").tenantId,
		features: features
	};
	return context;

};