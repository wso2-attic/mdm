var repostsModule = require('/modules/mdm_reports.js').mdm_reports;
var report = new repostsModule(db);


index = function(appController){		
	
	context = appController.context();
	context.title = context.title + " | Reports";	
	context.jsFile= "console/dashboard.js";
	context.page = "reports";
	context.data = {		
	};
	return context;	
	
};


all_reg_devices = function(appController){	
	
	
	
	if(request.getMethod() == 'POST'){
		
		var startdate = request.getParameter('startdate');
		var enddate = request.getParameter('enddate');
		var platform = request.getParameter('platform');
		
		var result = report.getDevicesByRegisteredDate({startdate: startdate, enddate: enddate, platform : platform});
		
		print(result);
		
		print(startdate + enddate + platform);
	}
	
		
	context = appController.context();
	context.title = context.title + " | Reports";	
	context.jsFile= "console/dashboard.js";
	context.page = "reports";
	context.data = {		
	};
	return context;	
	
};