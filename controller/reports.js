var repostsModule = require('/modules/mdm_reports.js').mdm_reports;
var report = new repostsModule(db);


index = function(appController){		
	
	context = appController.context();
	context.title = context.title + " | Reports";	
	context.page = "reports";
	context.data = {		
	};
	return context;	
	
};


all_reg_devices = function(appController){	
	
	var results = null; 
	
	if(request.getMethod() == 'POST'){
		
		var startdate = request.getParameter('startdate');
		var enddate = request.getParameter('enddate');
		var platform = request.getParameter('platform');
		
		var reportResults = report.getDevicesByRegisteredDate({startDate: startdate, endDate: enddate, platformType : platform});
		
		results = reportResults;
	}
	
		
	context = appController.context();
	context.title = context.title + " | Reports";	
	context.jsFile= "reports/reports.js";
	context.page = "reports";
	context.data = {
		results: results,
		inputData : {startdate: startdate, enddate: enddate, platform : platform}		
	};
	return context;	
	
};