var group = (function () {
    var configs = {
        CONTEXT: "/"
    };
    var routes = new Array();
	var log = new Log();
	var db;
	var deviceModule = require('device.js').device;
	var carbon = require('carbon');
	var server = new carbon.server.Server(configs.HTTPS_URL + '/admin');
	var device = new deviceModule();
	var common = require('common.js');
	var claimFirstName = "http://wso2.org/claims/givenname";
	var claimLastName = "http://wso2.org/claims/lastname";
	
    var module = function (dbs) {
		db = dbs;
        //mergeRecursive(configs, conf);
    };

    function mergeRecursive(obj1, obj2) {
        for (var p in obj2) {
            try {
                // Property in destination object set; update its value.
                if (obj2[p].constructor == Object) {
                    obj1[p] = MergeRecursive(obj1[p], obj2[p]);
                } else {
                    obj1[p] = obj2[p];
                }
            } catch (e) {
                // Property in destination object not set; create it and set its value.
                obj1[p] = obj2[p];
            }
        }
        return obj1;
    }
	
    // prototype
    module.prototype = {
        constructor: module,
		getGroups: function(ctx){
			var um = new carbon.user.UserManager(server, server.getDomainByTenantId(common.getTenantID()));
			var roles = um.allRoles();
			
			var arrRole = new Array();
			
			for(var i = 0; i < roles.length; i++) {
				if(common.isMDMRole(roles[i])) {
					arrRole.push(roles[i]);
				}
			}
			
			return arrRole;
		},
		delete: function(ctx){
			db.query("UPDATE groups SET deleted=1 WHERE id='"+ctx.groupid+"' ");
		},
		getUsers: function(ctx){

			var um = new carbon.user.UserManager(server, server.getDomainByTenantId(common.getTenantID()));
			var userList = um.getUserListOfRole(ctx.groupid);

			var arrUsers = new Array();	

			for(var i = 0; i < userList.length; i++) {
				
				if(!common.isMDMUser(userList[i])) {
					continue;
				}
			
				var objUser = {};
				
				var resultDeviceCount = db.query("SELECT COUNT(id) AS device_count FROM devices WHERE user_id = ? AND tenant_id = ?", userList[i], common.getTenantID());
				objUser.no_of_devices = resultDeviceCount[0].device_count;
				objUser.userid = String(userList[i]);
				
				var claims = [claimFirstName, claimLastName];
				var claimResult = um.getUserClaimValues(userList[i], claims, null);
				
				var keyIterator = claimResult.keySet().iterator();	
	
				while(keyIterator.hasNext()) {
					var claimKey = keyIterator.next();
					var claimValue = claimResult.get(claimKey);
					
					if(claimKey == claimFirstName) {
						objUser.firstName = String(claimValue);
					}
					
					if(claimKey == claimLastName) {
						objUser.lastName = String(claimValue);
					}

				}
				
				arrUsers.push(objUser);
			}
			
			return arrUsers;
		},
		add: function(ctx){
			
			var objResult = {};
			
			try {
				var tenant_id = common.getTenantID();
				var l = new Log();
				l.info("Baby");
				l.info(server.getDomainByTenantId(tenant_id));
				var um = new carbon.user.UserManager(server, server.getDomainByTenantId(tenant_id));
				
				if(um.roleExists(ctx.name)) {
					objResult.error = 'Role already exist in the system.';
				} else {
				    var permission = [
				        'http://www.wso2mobile.org/projects/mdm/actions/get',
				        'authorize'
				    ];
				    
				    var arrPermission = {};
				    var permission = [
				        'http://www.wso2.org/projects/registry/actions/get',
				        'http://www.wso2.org/projects/registry/actions/add',
				        'http://www.wso2.org/projects/registry/actions/delete',
				        'authorize'
				    ];
				    arrPermission["0"] = permission;
				    
					um.addRole(ctx.name, ctx.users, arrPermission);
					objResult.success = 'Role added successfully.';
				}
		
			} catch(e) {
				log.info(e);
				objResult.error = 'Error occurred while creating the role.';
			}

			return objResult;
		},
		operation: function(ctx){
			
	        var succeeded="";
	        var failed="";
	        
	        var um = new carbon.user.UserManager(server, server.getDomainByTenantId(common.getTenantID()));
			var userList = um.getUserListOfRole(ctx.groupid);

			var arrUsers = new Array();	

			for(var i = 0; i < userList.length; i++) {
				
				var objUser = {};
				
				var result = db.query("SELECT id FROM devices WHERE user_id = ? AND tenant_id = ?", String(userList[i]), common.getTenantID());

                log.info("Device Count >>>>>>>>>>"+stringify(result));

				for(var j = 0; j < result.length; j++) {
					
					var status = device.sendToDevice({'deviceid':result[i].id, 'operation': ctx.operation, 'data' : ctx.data});
		            if(status == true){
		                succeeded += result[i].id+",";
		            }else{
		                failed += result[i].id+",";
		            }
				}
			}
			
			if(succeeded != "" && failed != ""){

	            return "Succeeded : "+succeeded+", Failed : "+failed;
	        }else{
	            return "Succeeded : "+succeeded;
	        }

		}
    };
    // return module
    return module;
})();