management = function(appController){   
	context = appController.context();		

	context.title = context.title + " |  Devices Management";
	context.page = "management";
	context.jsFile= "devices/management.js";
	context.data = {		
		tenantId:session.get("mdmConsoleUser").tenantId
	};
	return context;

};