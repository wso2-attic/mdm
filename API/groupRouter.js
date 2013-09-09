var group = (function () {
	
    var module = function (db,router) {
		var groupModule = require('modules/group.js').group;
		var group = new groupModule(db);
		router.get('groups/', function(ctx){
			var groups= group.getGroups(ctx);
		    if(groups[0]!=null){
		        response.content = groups;
		        response.status = 200;
		    }else{
		        response.status = 404;
		    }
		});
		router.delete('groups/{groupid}', function(ctx){
			group.delete(ctx);
		    response.status = 201;
			return true;
		});
		router.get('groups/{groupid}/users', function(ctx){
			var groups = group.getUsers(ctx);
		    response.content = groups;
		    response.status = 200;
		});
		router.post('groups', function(ctx){
            log.info("Test Groups >>>>>>>>>>");
			var returnMsg = group.add(ctx);
		    if(returnMsg.success != null && returnMsg.success != undefined){
				response.status = 201;
		    }else{
		 		response.status = 400;
		 		print(returnMsg.error);
		    }
		});
		router.post('groups/{groupid}/operations/{operation}', function(ctx){
            log.info("Group Name >>>>>>>>>>>>>>"+ctx.groupid);
            log.info("Group Name >>>>>>>>>>>>>>"+ctx.operation);

            var subject = 'Admin';
            var action = request.getMethod();
            var resource =  ctx.groupid+"/"+ctx.operation;

            var policy = require('policy');
            policy.policy.init();
            var decision = policy.policy.getDecision(resource,action,subject,"");

            log.info("Decision >>>>>>>>>>>>>>"+decision);

            if(decision=="Permit"){
                response.status = 200;
                response.content = "success";
                var result = group.operation(ctx);

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