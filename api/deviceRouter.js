var device = (function () {
    var userModule = require('user.js').user;
	    var user;
    var module = function (db,router) {
		var deviceModule = require('modules/device.js').device;
		var device = new deviceModule(db);
		user = new userModule(db);

		router.post('devices/isregistered', function(ctx){
		    var result = device.isRegistered(ctx);
		    if(result!= null && result != undefined && result[0] != null && result[0] != undefined){
                log.info("Check isRegistered registered");
		        print("registered");
		        response.status = 200;
		    }else{
                log.info("Check isRegistered notregistered");
                print("notregistered");
		        //response.status = 404;
		    }
		});


		router.get('device_enroll', function(ctx){
		    var userAgent= request.getHeader("User-Agent");

		    var android = userAgent.indexOf("Android");

		    if(android>0){
		        response.sendRedirect(configs.HTTP_URL+"/mdm/mdm.apk");
		    }else{
		        response.sendRedirect(configs.RUBY_SERVER_URL);
		    }

		});

		router.post('devices/register', function(ctx){
		    var userAgent= request.getHeader("User-Agent");
		    var android = userAgent.indexOf("Android");

		    if(android > 0){
		        state = device.register(ctx);
		    }else{
		        state = device.registerIOS(ctx);
		    }

		});

		router.post('devices/unregister', function(ctx){
		    var result = device.unRegister(ctx);
		});

		router.post('devices/isregistered', function(ctx){
		    var result = device.isRegistered(ctx);
		});

		router.post('devices/{deviceid}/operations/{operation}', function(ctx){

            var policy = require('policy');
            policy.policy.init();

            var result = db.query("select * from devices where id ="+ctx.deviceid);
            var userId = result[0].user_id;
            var roleList = parse(user.getUserRoles({'username':userId}));

            log.info("Role List >>>>>>>>"+roleList[0]);

             for(var i = 0;i<roleList.length;i++){
                var resource = roleList[i]+"/"+ctx.operation
                var action = request.getMethod();
                var subject = 'Admin';
                log.info("Resource >>>>>>>"+resource);
                var decision = policy.policy.getDecision(resource,action,subject,"");
                if(decision=="Permit"){
                    break;
                }
             }
             log.info("Test Decision >>>>>>>>>>>>>>"+decision);
             if(decision=="Permit"){
                response.status = 200;
                response.content = "success";
                var result = device.sendToDevice(ctx);

             }else{
                response.status = 404;
                print("Not Allowed");
             }
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