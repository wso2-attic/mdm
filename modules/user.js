var TENANT_CONFIGS = 'tenant.configs';
var USER_MANAGER = 'user.manager';
var user = (function () {
    var config = require('../config/config.json');
    var routes = new Array();

	var log = new Log();
	var db;
	var device;
	var deviceModule = require('device.js').device;
	var common = require("/modules/common.js");
	var carbon = require('carbon');
	var server = function(){
		return application.get("SERVER");
	}
	
	var claimEmail = "http://wso2.org/claims/emailaddress";
	var claimFirstName = "http://wso2.org/claims/givenname";
	var claimLastName = "http://wso2.org/claims/lastname";
	var claimMobile = "http://wso2.org/claims/mobile";
	
    var module = function (dbs) {
		db = dbs;
        device = new deviceModule(db);
        //mergeRecursive(configs, conf);
    };

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
	
	var createPrivateRolePerUser = function(username){
		var um = userManager(common.getTenantID());
		var indexUser = username.replace("@", ":");
		var arrPermission = {};
	    var permission = [
	        'http://www.wso2.org/projects/registry/actions/get',
	        'http://www.wso2.org/projects/registry/actions/add',
	        'http://www.wso2.org/projects/registry/actions/delete',
	        'authorize','login'
	    ];
	    arrPermission[0] = permission;
		um.addRole("private_"+indexUser, [username], arrPermission);
	}			
	
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
		authenticate: function(ctx){
			log.info("username "+ctx.username);
			var authStatus = server().authenticate(ctx.username, ctx.password);
			log.info(">>auth "+authStatus);
			if(!authStatus) {
				return null;
			}
			var user =  this.getUser({userid: ctx.username});
			var result = db.query("SELECT COUNT(id) AS record_count FROM tenantplatformfeatures WHERE tenant_id = ?",  stringify(user.tenantId));
			if(result[0].record_count == 0) {
				for(var i = 1; i < 13; i++) {
					var result = db.query("INSERT INTO tenantplatformfeatures (tenant_id, platformFeature_Id) VALUES (?, ?)", stringify(user.tenantId), i);
				}
			}
		    return user;
		},
		devices: function(obj){
			var devices = db.query("SELECT * FROM devices WHERE user_id= ? AND tenant_id = ?", String(obj.userid), common.getTenantID());
			return devices;
		},
		getUser: function(ctx){
			try {
				var proxy_user = {};
				var tenantUser = carbon.server.tenantUser(ctx.userid);
				log.info("User ID >>>>>>"+ctx.userid);
				var um = userManager(tenantUser.tenantId);
			    var user = um.getUser(tenantUser.username);
		    	var claims = [claimEmail, claimFirstName, claimLastName];
				var claimResult = user.getClaimsForSet(claims,null);
				proxy_user.email = claimResult.get(claimEmail);
				proxy_user.firstName = claimResult.get(claimFirstName);
				proxy_user.lastName = claimResult.get(claimLastName);
				proxy_user.mobile = claimResult.get(claimMobile);
				proxy_user.username = tenantUser.username;
				proxy_user.tenantId = tenantUser.tenantId;
				proxy_user.roles = stringify(user.getRoles());
				return proxy_user;
			} catch(e) {
				log.error(e);
				var error = 'Error occurred while retrieving user.';
				return error;
			}
		},
        getUsersWithoutMDMRoles:function(ctx){
            var users = this.getUsers();
            log.info("All Users >>>>>>>>>"+stringify(users));
            var array =  new Array();

            for(var i =0 ;i<users.length;i++){
                log.info(users[i].username);
                var roles = parse(this.getUserRoles({'username':users[i].username}));

                var flag = false;
                for(var j=0 ;j<roles.length;j++){
                    log.info("Test iteration2"+roles[j]);
                    if(roles[j]=='admin'||roles[j]=='mdmadmin'){
                        flag = true;
                        break;
                    }else{
                        flag = false;
                    }
                }
                if(flag == false){
                   array.push(users[i]);
                }
            }
            log.info("Users without admins >>>>>>>>>"+stringify(array));
            return array;
        },
		getUserRoles: function(ctx){
			var um = userManager(common.getTenantID());
		    var user = um.getUser(ctx.username);

            var tempRoles = user.getRoles();
            var roles = new Array();

            for(var i = 0; i<tempRoles.length; i++){
                if(tempRoles[i].substring(0,8) == 'private_'){
                    continue;
                }else{
                    roles.push(tempRoles[i]);
                }
            }
			return stringify(roles);
		},
        getRolesByUser:function(ctx){

            var allRoles = this.getGroups(ctx);
            var userRoles = parse(this.getUserRoles(ctx));
            var array = new Array();
            if(userRoles.length == 0){
                for(var i=0;i < allRoles.length;i++){
                    var obj = {};
                    obj.name = allRoles[i];
                    obj.available = false;
                    array.push(obj);
                }
            }else{
                for(var i=0;i < allRoles.length;i++){
                    var obj = {};
                    for(var j=0;j< userRoles.length;j++){
                        if(allRoles[i]==userRoles[j]){
                            obj.name = allRoles[i];
                            obj.available = true;
                            break;
                        }else{
                            obj.name = allRoles[i];
                            obj.available = false;
                        }
                    }
                    array.push(obj);
                }
            }

            log.info(array);
            return array;
        },
        updateRoleListOfUser:function(ctx){
            log.info(ctx.username);
            log.info(ctx.removed_groups);
            log.info(ctx.added_groups);
            var existingRoles = this.getUserRoles(ctx);
            var addedRoles = ctx.added_groups;
            var newRoles = new Array();
            for(var i=0;i<addedRoles.length;i++){
               var flag = false;
               for(var j=0;j<existingRoles.length;j++){
                   if(addedRoles[i]== existingRoles[j]){
                        flag = true;
                        break;
                   }else{
                       flag = false;
                   }
               }
               if(flag == false){
                   newRoles.push(addedRoles[i]);
               }
            }

            var removedRoles = ctx.removed_groups;
            var deletedRoles = new Array();
            for(var i=0;i<removedRoles.length;i++){
                var flag = false;
                for(var j=0;j<existingRoles.length;j++){
                    if(removedRoles[i]== existingRoles[j]){
                        flag = true;
                        break;
                    }else{
                        flag = false;
                    }
                }
                if(flag == true){
                    deletedRoles.push(removedRoles[i]);
                }
            }

            var tenantUser = carbon.server.tenantUser(ctx.username);
            var um = userManager(tenantUser.tenantId);
            um.updateRoleListOfUser(ctx.username, deletedRoles, newRoles);
        },
		sendEmail: function(ctx){
		    content = "Dear "+ ctx.first_name+", \nYou have been registered to the WSO2 MDM. Please click the link below to enroll your device.\n \nLink - "+config.HTTPS_URL+"/mdm/api/device_enroll \n \nWSO2 MDM Team";
		    subject = "MDM Enrollment";

		    var email = require('email');
		    var sender = new email.Sender("smtp.gmail.com", "25", "dulitha@wso2mobile.com", "brainsteamer", "tls");
		    sender.from = "mdm@wso2mobile.com";

		    log.info(ctx.username);
		    sender.to = ctx.username;
		    sender.subject = subject;
		    sender.text = content;
		    sender.send();
		},
		addUser: function(ctx){
            log.info("Mobile >>>>>>>>>>>"+ctx.mobile_no);
			var claimMap = new java.util.HashMap();
			claimMap.put(claimEmail, ctx.username);
			claimMap.put(claimFirstName, ctx.first_name);
			claimMap.put(claimLastName, ctx.last_name);
			claimMap.put(claimMobile, ctx.mobile_no);
			var proxy_user = {};
			
			try {
				var tenantId = common.getTenantID();
				var users_list = Array();
				if(tenantId){
					var um = userManager(common.getTenantID());
					if(um.userExists(ctx.username)) {
						objResult.error = 'User already exist with the email address.';
					} else {
						um.addUser(ctx.username, ctx.password, 
							ctx.groups, claimMap, null);	
					    createPrivateRolePerUser(ctx.username);				
					}
				}
				else{
					log.error('Error in getting the tenantId from session');
					print('Error in getting the tenantId from session');
				}
			} catch(e) {
				log.error(e);
				proxy_user.error = 'Error occurred while creating the user.';
			}
			return proxy_user;
		},
        deleteUser: function(ctx){
            var um = userManager(common.getTenantID());

            um.removeUser(ctx.userid);

        },

        getGroups: function(ctx){
            var um = userManager(common.getTenantID());
            var roles = new Array();
            var tempRoles = um.allRoles();
            for(var i = 0; i<tempRoles.length; i++){
                if(tempRoles[i].substring(0,8) == 'private_'){
                    continue;
                }else{
                    roles.push(tempRoles[i]);
                }
            }
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

		getUsers: function(ctx){
			var tenantId = common.getTenantID();
			var users_list = Array();
			if(tenantId){
                    log.info("Tenant ID >>>>>>"+common.getTenantID());
					var um = userManager(common.getTenantID());
					var arrUserName = parse(stringify(um.listUsers()));
                    log.info("Userssssssssss"+arrUserName);
					for(var i = 0; i < arrUserName.length; i++) {
                        log.info(common.isMDMUser(arrUserName[i]));
						if(!common.isMDMUser(arrUserName[i])) {

							continue;
						}
                        log.info("Test Admin"+arrUserName[i]);
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
						users_list.push(proxy_user);
						
					}	
			}else{
				print('Error in getting the tenantId from session');
			}
			log.info("LLLLLLLLLLLLLLLLLLLL"+stringify(users_list));
			return users_list;
		},
        getUsersByType:function(ctx){
            var type = ctx.type;
            if(type == 'admin'){
                var users = this.getUsers();
                log.info("Userssssssssssssssssssssss"+stringify(users));
                for(var i =0 ;i<users.length;i++){
                    log.info(users[i].username);

                    var roles = parse(this.getUserRoles({'username':users[i].username}));
                    var flag = 0;
                    for(var j=0 ;j<roles.length;j++){
                        log.info("Test iteration2"+roles[j]);
                        if(roles[j]=='admin'||roles[j]=='mdmadmin'){
                            flag = 1;
                            break;
                        }else if(roles[j]=='store'||roles[j]=='publisher'){
                            flag = 2;
                            break;
                        }else{
                            flag = 0;
                        }
                    }
                    if(flag == 1){
                        users[i].type = 'administrator';
                    }else if(flag == 2) {
                        users[i].type = 'mam';
                    }else{
                        users[i].type = 'user';
                    }
                }
                return users;
            }else if (type == 'mdmadmin'){
                var users = this.getUsers();
                var array = new Array();
                for(var i =0 ;i<users.length;i++){
                    log.info(users[i].username);

                    var roles = parse(this.getUserRoles({'username':users[i].username}));
                    var flag = false;
                    for(var j=0 ;j<roles.length;j++){
                        log.info("Test iteration2"+roles[j]);
                        if(roles[j]=='admin'||roles[j]=='mdmadmin'){
                            flag = true;
                            break;
                        }else{
                            flag = false;
                        }
                    }
                    if(flag == false){
                        users[i].type = 'user';
                        array.push(users[i]);
                    }
                }
                log.info("User Array >>>>>>>>>>>>>"+array);
                return array;
            }
        },
		operation: function(ctx){
			var device_list = db.query("SELECT id, reg_id, os_version, platform_id FROM devices WHERE user_id = ?", ctx.userid);
		    var succeeded="";
		    var failed="";
		    for(var i=0; i<device_list.length; i++){
		        var status = device.sendToDevice({'deviceid':device_list[i].id, 'operation': ctx.operation, 'data' : ctx.data});
		        if(status == true){
		            succeeded += device_list[i].id+",";
		        }else{
		            failed += device_list[i].id+",";
		        }
		    }
		    return "Succeeded : "+succeeded+", Failed : "+failed;
		}
    };
    // return module
    return module;
})();