var isMDMRole = function (role) {
	var otherRoles = new Array("everyone", "portal", "store", "wso2.anonymous.role", "publisher", "reviewer","admin","mdmadmin");
	for(var i = 0; i < otherRoles.length; i++) {
		if(role == otherRoles[i]) {
			return false;
		}
	}
	return true;
}

var isMDMRoleWithAdmins = function (role) {
    var otherRoles = new Array("everyone", "portal", "store", "wso2.anonymous.role", "publisher", "reviewer");
    for(var i = 0; i < otherRoles.length; i++) {
        if(role == otherRoles[i]) {
            return false;
        }
    }
    return true;
}

var isMDMUser = function (user) {
	var otherUsers = new Array("wso2.anonymous.user");
	for(var i = 0; i < otherUsers.length; i++) {
		if(user == otherUsers[i]) {
			return false;
		}
	}
	return true;
}

var getTenantID = function(){
	if(session.get("mdmConsoleUser")){
		return session.get("mdmConsoleUser")['tenantId'];
	}else{
		return null;
	}
}