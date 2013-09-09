var user = (function () {
    var configs = require('/config.json');
    var routes = new Array();
	var log = new Log();
	var db;
	var deviceModule = require('device.js').device;
	var device;
	var common = require("/modules/common.js");
    var module = function (dbs) {
		db = dbs;
        device = new deviceModule(db);
        //mergeRecursive(configs, conf);
    };
	var carbon = require('carbon');
	var server = new carbon.server.Server(configs.HTTPS_URL + '/admin');
	
	var claimEmail = "http://wso2.org/claims/emailaddress";
	var claimFirstName = "http://wso2.org/claims/givenname";
	var claimLastName = "http://wso2.org/claims/lastname";
	var claimMobile = "http://wso2.org/claims/mobile";
				
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
			
			var authStatus = server.authenticate(ctx.username, ctx.password);
			
			if(!authStatus) {
				return null;
			}

			var tenantAwareUsername = server.getTenantAwareUsername(ctx.username);
            log.info(tenantAwareUsername);
		    var um = new carbon.user.UserManager(server, server.getTenantDomain(ctx.username));
		    var user = um.getUser(tenantAwareUsername);
		    user.roles = stringify(user.getRoles());
		    
	    	var claims = [claimEmail, claimFirstName, claimLastName];
			var claimResult = um.getUserClaimValues(tenantAwareUsername, claims, null);
			
			var keyIterator = claimResult.keySet().iterator();	

			while(keyIterator.hasNext()) {
				var claimKey = keyIterator.next();
				var claimValue = claimResult.get(claimKey);
				
				if(claimKey == claimEmail) {
					user.email = claimValue;
				}
				
				if(claimKey == claimFirstName) {
					user.firstName = claimValue;
				}
				
				if(claimKey == claimLastName) {
					user.lastName = claimValue;
				}
				
				if(claimKey == claimMobile) {
					user.mobile = claimValue;
				}
			}
			
			//temporarily adding platform features from code 
			var tenantId = server.getTenantIdByDomain(server.getTenantDomain(ctx.username));
			var result = db.query("SELECT COUNT(id) AS record_count FROM tenantplatformfeatures WHERE tenant_id = ?",  stringify(tenantId));
			
			if(result[0].record_count == 0) {
				for(var i = 1; i < 13; i++) {
					var result = db.query("INSERT INTO tenantplatformfeatures (tenant_id, platformFeature_Id) VALUES (?, ?)", stringify(tenantId), i);
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
				var tenantAwareUsername = server.getTenantAwareUsername(ctx.userid);
			    var um = new carbon.user.UserManager(server, server.getTenantDomain(ctx.userid));
			    var user = um.getUser(tenantAwareUsername);
			    user.roles = stringify(user.getRoles());
		    	
		    	var claims = [claimEmail, claimFirstName, claimLastName];
				var claimResult = um.getUserClaimValues(tenantAwareUsername, claims, null);
				
				var keyIterator = claimResult.keySet().iterator();	
	
				while(keyIterator.hasNext()) {
					var claimKey = keyIterator.next();
					var claimValue = claimResult.get(claimKey);
					
					if(claimKey == claimEmail) {
						user.email = claimValue;
					}
					
					if(claimKey == claimFirstName) {
						user.firstName = claimValue;
					}
					
					if(claimKey == claimLastName) {
						user.lastName = claimValue;
					}
					
					if(claimKey == claimMobile) {
						user.mobile = claimValue;
					}
				}

				return user;
			} catch(e) {
				var error = 'Error occurred while retrieving user.';
				
				return error;
			}
		},
		getUserRoles: function(ctx){
            var tenantAwareUsername = server.getTenantAwareUsername(ctx.username);
            log.info(tenantAwareUsername);
            var um = new carbon.user.UserManager(server, server.getTenantDomain(ctx.username));
            var user = um.getUser(tenantAwareUsername);

			return stringify(user.getRoles());
		},
		sendEmail: function(ctx){
		    content = "Dear "+ ctx.first_name+", \nYou have been registered to the WSO2 MDM. Please click the link below to enroll your device.\n \nLink - "+configs.HTTPS_URL+"/mdm/api/device_enroll \n \nWSO2 MDM Team";
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
			
			var claimMap = new java.util.HashMap();
			claimMap.put(claimEmail, ctx.username);
			claimMap.put(claimFirstName, ctx.first_name);
			claimMap.put(claimLastName, ctx.last_name);
			claimMap.put(claimMobile, ctx.mobile_no);
	
			var objResult = {};
			
			try {
				var um = new carbon.user.UserManager(server, server.getDomainByTenantId(common.getTenantID()));
				
				if(um.userExists(server.getTenantAwareUsername(ctx.username))) {
					objResult.error = 'User already exist with the email address.';
				} else {
					um.addUser(server.getTenantAwareUsername(ctx.username), ctx.password, 
						ctx.groups, claimMap, null);					
				}

			} catch(e) {
				objResult.error = 'Error occurred while creating the user.';
			}

			return objResult;
		},
		getGroups: function(ctx){
			var um = new carbon.user.UserManager(server, server.getDomainByTenantId(common.getTenantID()));
			return um.allRoles();
		},
		getUsers: function(ctx){
			var um = new carbon.user.UserManager(server, server.getDomainByTenantId(common.getTenantID()));
			var arrUserName = parse(stringify(um.listUsers()));
			
			//get profiles um.getAllProfileNames()
			
			var objUser = Array();
			
			for(var i = 0; i < arrUserName.length; i++) {

				if(!common.isMDMUser(arrUserName[i])) {
					continue;
				}
				
				var user = {};
				user.username = arrUserName[i];
				
				var claims = [claimEmail, claimFirstName, claimLastName];
				var claimResult = um.getUserClaimValues(arrUserName[i], claims, null);
				
				var keyIterator = claimResult.keySet().iterator();	

				while(keyIterator.hasNext()) {
					var claimKey = keyIterator.next();
					var claimValue = claimResult.get(claimKey);
					
					if(claimKey == claimEmail) {
						user.email = claimValue;
					}
					
					if(claimKey == claimFirstName) {
						user.firstName = claimValue;
					}
					
					if(claimKey == claimLastName) {
						user.lastName = claimValue;
					}
					
					if(claimKey == claimMobile) {
						user.mobile = claimValue;
					}
				}

				objUser.push(user);
			}

			return objUser;
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