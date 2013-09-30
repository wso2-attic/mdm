var TENANT_CONFIGS = 'tenant.configs';
var USER_MANAGER = 'user.manager';
var group = (function () {

    var routes = new Array();
	var log = new Log();
	var db;
	var deviceModule = require('device.js').device;
	var device = new deviceModule();
	var common = require('common.js');
    var claimEmail = "http://wso2.org/claims/emailaddress";
    var claimFirstName = "http://wso2.org/claims/givenname";
    var claimLastName = "http://wso2.org/claims/lastname";
    var claimMobile = "http://wso2.org/claims/mobile";
	
	var carbon = require('carbon');
	var server = function(){
		return application.get("SERVER");
	}
	
	var configs = function (tenantId) {
	    var configg = application.get(TENANT_CONFIGS);
		if (!tenantId) {
	        return configg;
	    }
	    return configs[tenantId] || (configs[tenantId] = {});
	};			
	/**
	 * Returns the user manager of the given tenant.
	 * @param tenantId
	 * @return {*}
	 */
	var userManager = function (tenantId) {
	    var config = configs(tenantId);
	    if (!config || !config[USER_MANAGER]) {
			var um = new carbon.user.UserManager(server, tenantId);
			config[USER_MANAGER] = um;
	        return um;
	    }
	    return configs(tenantId)[USER_MANAGER];
	};
	
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
            log.info( "Type >>>>>>>>>>>"+ctx.type);
            var type = ctx.type;

			var um = userManager(common.getTenantID());
			var roles = um.allRoles();
            log.info("ALL Roles >>>>>>>>>>"+stringify(roles));

            var arrRole = new Array();
            for(var i = 0; i < roles.length; i++) {
                if(common.isMDMRole(roles[i])) {
                    arrRole.push(roles[i]);
                }
            }
            log.info("ALL Roles >>>>>>>>>>"+stringify(arrRole));
            return arrRole;

		},
        getGroupsByType: function(ctx){
            var type = ctx.type;

            if(type == 'admin'){
                var um = userManager(common.getTenantID());
                var roles = um.allRoles();
                log.info("ALL Roles >>>>>>>>>>"+stringify(roles));
                var arrRole = new Array();
                for(var i = 0; i < roles.length; i++) {
                    if(common.isMDMRoleWithAdmins(roles[i])) {
                        var obj = {};
                        if(roles[i] == 'admin'||roles[i] == 'mdmadmin'){
                            obj.name = roles[i];
                            obj.type = 'administrator';
                        }else{
                            obj.name = roles[i];
                            obj.type = 'user';
                        }
                        arrRole.push(obj);
                    }
                }
                log.info("ALL Roles >>>>>>>>>>"+stringify(arrRole));
                return arrRole;
            }else if(type == 'mdmadmin'){
                var um = userManager(common.getTenantID());
                var roles = um.allRoles();
                log.info("ALL Roles >>>>>>>>>>"+stringify(roles));
                var arrRole = new Array();
                for(var i = 0; i < roles.length; i++) {
                    if(common.isMDMRole(roles[i])) {
                        var obj = {};
                        obj.name = roles[i];
                        obj.type = 'user';
                        arrRole.push(obj);
                    }
                }
                log.info("ALL Roles >>>>>>>>>>"+stringify(arrRole));
                return arrRole;
            }
        },
		delete: function(ctx){
            var um = userManager(common.getTenantID());

            var result = um.removeRole(ctx.groupid);

            if(result){
                response.status = 200;
            }else{
                response.status = 404;
            }
		},
		getUsers: function(ctx){
            log.info("Group Name >>>>>"+ctx.groupid);
			var tenantId = common.getTenantID();
			var users_list = Array();
			if(tenantId){
				var um = userManager(common.getTenantID());
				var arrUserName = um.getUserListOfRole(ctx.groupid);
                log.info(arrUserName.length);
				for(var i = 0; i < arrUserName.length; i++) {
					if(!common.isMDMUser(arrUserName[i])) {
						continue;
					}

					var user = um.getUser(arrUserName[i]);
					var proxy_user = {};
					proxy_user.username = arrUserName[i];

					var claims = [claimEmail, claimFirstName, claimLastName];

					var claimResult = user.getClaimsForSet(claims,null);
					proxy_user.email = claimResult.get(claimEmail);
					proxy_user.firstName = claimResult.get(claimFirstName);
					proxy_user.lastName = claimResult.get(claimLastName);
					proxy_user.mobile = claimResult.get(claimMobile);
					proxy_user.tenantId = tenantId;
					proxy_user.roles = stringify(user.getRoles());

					var resultDeviceCount = db.query("SELECT COUNT(id) AS device_count FROM devices WHERE user_id = ? AND tenant_id = ?", arrUserName[i], proxy_user.tenantId);
					proxy_user.no_of_devices = resultDeviceCount[0].device_count;

					users_list.push(proxy_user);
				}

			}else{
				log.error('Error in getting the tenantId from session');
				print('Error in getting the tenantId from session');
			}
            log.info("Element >>>>>>"+stringify(users_list));
			return users_list;
		},
		add: function(ctx){
            log.info("Test function"+ctx.name);
            log.info("Test function"+ctx.users);
			var proxy_role = {};
			var tenant_id = common.getTenantID();
			if(tenant_id){
				var um = userManager(tenant_id);
				try{
					if(um.roleExists(ctx.name)) {
						proxy_role.error = 'Role already exist in the system.';
                        proxy_role.status = "ALLREADY_EXIST";
					} else {

					    var arrPermission = {};
					    var permission = [
					        'http://www.wso2.org/projects/registry/actions/get',
					        'http://www.wso2.org/projects/registry/actions/add',
					        'http://www.wso2.org/projects/registry/actions/delete',
					        'authorize','login'
					    ];
					    arrPermission[0] = permission;
                        log.info(ctx.name);
                        log.info(ctx.users);
						um.addRole(ctx.name, ctx.users, arrPermission);
						proxy_role.success = 'Role added successfully.';
                        proxy_role.status = "SUCCESSFULL";
					}
				}catch(e){
                    log.info("Error");
                    proxy_role.status = "BAD_REQUEST";
					log.error(e);
				}
			}else{
                proxy_role.status = "SERVER_ERROR";
				print('Error in getting the tenantId from session');
			}
            log.info(proxy_role);
			return proxy_role;
		},
        assignUsers: function(ctx){
            log.info("Test Function");

            var existingUsers = this.getUsers(ctx);
            var addedUsers = ctx.added_users;
            var newUsers = new Array();

            for(var i=0;i<addedUsers.length;i++){
                var flag = false;
                for(var j=0;j<existingUsers.length;j++){
                    if(addedUsers[i]== existingUsers[j].username){
                        flag = true;
                        break;
                    }else{
                        flag = false;
                    }
                }
                if(flag == false){
                    newUsers.push(addedUsers[i]);
                }
            }

            var removedUsers = ctx.removed_users;
            var deletedUsers = new Array();
            for(var i=0;i<removedUsers.length;i++){
                var flag = false;
                for(var j=0;j<existingUsers.length;j++){
                    if(removedUsers[i]== existingUsers[j]){
                        flag = true;
                        break;
                    }else{
                        flag = false;
                    }
                }
                if(flag == true){
                    deletedUsers.push(removedUsers[i]);
                }
            }


            var um = userManager(common.getTenantID());
            um.updateUserListOfRole(ctx.groupid , deletedUsers, newUsers);

        },
        getUsersByGroup:function(ctx){
            log.info("Test Function");
            var users = this.getUsers(ctx);

            log.info("Selected Users"+stringify(users));

            var allUsers = user.getUsers(ctx);

            log.info("All Users"+stringify(allUsers));
            if(users.length==0){
                for(var i=0;i<allUsers.length;i++){
                    allUsers[i].available = false;
                }
            }else{
                for(var i=0;i<allUsers.length;i++){
                    for(var j=0;j<users.length;j++){
                        if(allUsers[i].username==users[j].username){
                            allUsers[i].available = true;
                            break;
                        }else{
                            allUsers[i].available = false;
                        }
                    }
                }
            }
            log.info("Final Result :"+stringify(allUsers));
            return allUsers;
        },
		operation: function(ctx){
	        var succeeded="";
	        var failed="";

            var um = userManager(common.getTenantID());
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