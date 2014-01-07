var mdm_reports = (function () {

    var module = function (db,router) {
        var reportModule = require('modules/mdm_reports.js').mdm_reports;
        var report = new reportModule(db);
        router.get('mdm_reports/devices/registration', function(ctx){
            var reports = report.getDevicesByRegisteredDate(ctx);
            if(reports[0]!=null){
                response.content = reports;
                response.status = 200;
            }else{
                response.status = 404;
            }
        });
    };
    // prototype
    module.prototype = {
        constructor: module
    };
    // return module
    return module;
})();