var notification = (function () {
	
    var module = function (db,router) {
		var notificationModule = require('modules/notification.js').notification;
		var notification = new notificationModule(db);
		router.get('notifications/devices/{deviceid}', function(ctx){
		    var result = notification.getNotifications(ctx);
            log.info("Test Notification Result"+result);
		    if(result!= null && result != undefined && result[0] != null && result[0] != undefined){
		        response.content = result;
		        response.status = 200;
		    }else{
		        response.status = 404;
		    }
		});

		router.post('notifications/ios', function(ctx){
		    var result = notification.addIosNotification(ctx);
		});

		router.post('notifications', function(ctx){
		    var result = notification.addNotification(ctx);
		});

		router.get('refresh/devices/{deviceid}/{operation}', function(ctx){
		    var result = notification.getLastRecord(ctx);
		    if(result!= null && result != undefined){
                log.info("Test Refresh Result"+stringify(result));
		        response.content = result;
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