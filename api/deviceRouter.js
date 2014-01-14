
var device = (function () {
    var userModule = require('user.js').user;
	    var user;
    var module = function (db,router) {
		var deviceModule = require('modules/device.js').device;
		var device = new deviceModule(db);
		user = new userModule(db);


        var validateDevice = function() {

            //Allow Android version 4.0.3 and above
            //Allow iOS (iPhone and iPad) version 5.0 and above

            var userOS; //will either be iOS, Android or unknown
            var userOSversion;  //will be a string, use Number(userOSversion) to convert

            var useragent = arguments[0];
            var uaindex;

            //determine the OS
            if(useragent.match(/iPad/i) || useragent.match(/iPhone/i)) {
                userOS = 'iOS';
                uaindex = useragent.indexOf('OS ');
            } else if (useragent.match(/Android/i)) {
                userOS = 'Android';
                uaindex = useragent.indexOf('Android ');
            } else {
                userOS = 'unknown';
            }

            //determine version
            if (userOS == 'iOS' && uaindex > -1) {
                userOSversion = useragent.substr(uaindex + 3, 3).replace('_', '.');
            } else if (userOS == 'Android' && uaindex > -1) {
                userOSversion = useragent.substr(uaindex + 8, 3);
            } else {
                userOSversion = 'unknown';
            }

            if (userOS == 'Android' && userOSversion.substr(0, 4) == '4.0.') {
                if(Number(userOSversion.charAt(4)) >= 3 ) {
                    //Allow device
                    return true;
                }else {
                    //Android version not allowed
                    return false;
                }
            } else if (userOS == 'Android' && Number(userOSversion.substr(0,3)) >= 4.1) {
                //Allow device
                return true;
            } else if(userOS == 'iOS' && Number(userOSversion.charAt(0)) >= 5) {
                //Allow device
                return true;
            } else {
                return false;
            }
        }

		router.post('devices/isregistered', function(ctx){
		    var result = device.isRegistered(ctx);
            log.info(result);
		    if(result){
                log.info("Check isRegistered registered");
		        print("registered");
		        response.status = 200;
		    }else{
                log.info("Check isRegistered notregistered");
                print("notregistered");
		        response.status = 404;
		    }
		});


		router.get('device_enroll', function(ctx){
            var userAgent= request.getHeader("User-Agent");

            if (validateDevice(userAgent) == false) {
                response.sendRedirect("../invaliddevice");
            } else if (userAgent.indexOf("Android") > 0) {
                response.sendRedirect("/mdm/androidapk");
            } else if (userAgent.indexOf("iPhone") > 0) {
                response.sendRedirect(configs.device.ios_location);
            } else if (userAgent.indexOf("iPad") > 0){
                response.sendRedirect(configs.device.ios_location);
            } else if (userAgent.indexOf("iPod") > 0){
                response.sendRedirect(configs.device.ios_location);
            } else {
                response.sendRedirect("../invaliddevice");
            }

		});

		router.post('devices/register', function(ctx){
		    var userAgent= request.getHeader("User-Agent");
		    var android = userAgent.indexOf("Android");

		    if(android > 0){
		        device.registerAndroid(ctx);
                	response.status = 201;
                	response.content = "registered"
		    }else{
                	var content = device.registerIOS(ctx);
		    }
		});

		router.post('devices/unregister', function(ctx){
		    var result = device.unRegisterAndroid(ctx);
		});
		
		router.post('devices/unregisterios', function(ctx){
		    var result = device.unRegisterIOS(ctx);
		});

		router.post('devices/AppInstall', function(ctx){
            ctx.operation = "INSTALLAPP";
			for (var i = ctx['data'].length - 1; i >= 0; i--){
				var operation =  ctx['data'][i];
				log.info('>>>>>>>>>');
				log.info(operation);
				var result = device.sendToDevice({data:operation, operation: ctx.operation, platform_id: operation.platform_id, deviceid: String(operation.deviceid)});
			};
		});

		router.post('devices/AppUNInstall', function(ctx){
            ctx.operation = "UNINSTALLAPP";
		    for (var i = ctx['data'].length - 1; i >= 0; i--){
				var operation =  ctx['data'][i];
				var result = device.sendToDevice({data:operation, operation: ctx.operation, platform_id: operation.platform_id, deviceid: String(operation.deviceid)});
			};
		});

		router.post('devices/{deviceid}/operations/{operation}', function(ctx){
            if(ctx.operation == "INSTALLAPP" || ctx.operation == "UNINSTALLAPP"){
                var state = device.getCurrentDeviceState();
                if(state == "A"){
                    device.sendToDevice(ctx);
                    response.status = 200;
                    response.content = "success";
                }
            }else{
                device.sendToDevice(ctx);
                response.status = 200;
                response.content = "success";
            }
		});

        router.post('devices/operations/{operation}', function(ctx){
            log.info("test devie router");
            log.info(stringify(ctx));
            device.sendToDevices(ctx);
            response.status = 200;
            response.content = "success";

        });

		router.get('devices/{deviceid}/features', function(ctx){

		    var result = device.getFeaturesFromDevice(ctx);
            log.info("Test Result"+result);
		    if(result!= null && result != undefined && result[0] != null && result[0] != undefined){
		        response.content = result;
		        response.status = 200;
		    }else{
		        response.status = 404;
		    }
		});

		router.post('devices/{deviceid}', function(ctx){
		    var result = device.updateiOSTokens(ctx);
		});

        router.get('devices/license', function(ctx){
            //var result = device.testingService();
            var result = device.getLicenseAgreement(ctx);
            if (result == "400") {
                response.status = 400;
            } else {
                print(result);
                response.status = 200;
            }
        });

        router.get('devices/sender_id', function(ctx){
            var result = device.getSenderId(ctx);
            print(result);
            response.status = 200;
        });


		router.get('pending/devices/{udid}/operations', function(ctx){
		    var result = device.getPendingOperationsFromDevice(ctx);
		    if(result!= null && result != undefined){
               // log.info("Pending Result"+result);
		        response.content = result;
		        response.status = 200;
		    }else{
		        response.status = 404;
		    }
		});
		
		router.post('devices/{deviceid}/AppInstall', function(ctx){
            ctx.operation = "INSTALLAPP";
		    var result = device.sendToDevice(ctx);
		});

		router.post('devices/{deviceid}/AppUNInstall', function(ctx){
            ctx.operation = "UNINSTALLAPP";
		    var result = device.sendToDevice(ctx);
		});
    };
    // prototype
    module.prototype = {
        constructor: module
    };
    // return module
    return module;
})();
