var isMDMRole = function(role) {
	var otherRoles = new Array("everyone", "portal", "store", "wso2.anonymous.role", "publisher", "reviewer", "admin", "mdmadmin");
	for (var i = 0; i < otherRoles.length; i++) {
		if (role == otherRoles[i]) {
			return false;
		}
	}
	return true;
}

var isMDMRoleWithAdmins = function(role) {
	var otherRoles = new Array("everyone", "portal", "store", "wso2.anonymous.role", "publisher", "reviewer");
	for (var i = 0; i < otherRoles.length; i++) {
		if (role == otherRoles[i]) {
			return false;
		}
	}
	return true;
}

var isMDMUser = function (user) {
	var otherUsers = new Array("wso2.anonymous.user","admin");
	for(var i = 0; i < otherUsers.length; i++) {
		if(user == otherUsers[i]) {
			return true;
		}
	}	
}

var getTenantID = function() {
	if (session.get("mdmConsoleUser")) {
		return session.get("mdmConsoleUser")['tenantId'];
	} else {
		return null;
	}
}

var getCAPath = function() {
	return "E://Mobile//iOS_MDM_Impl//keys//ca_cert.pem";
}

var getRAPath = function() {
	return "E://Mobile//iOS_MDM_Impl//keys//ra_cert.pem";
}

var getCAPrivateKey = function() {
	return "E://Mobile//iOS_MDM_Impl//keys//ca_private.pem";
}

var getRAPrivateKey = function() {
	return "E://Mobile//iOS_MDM_Impl//keys//ra_private.pem";
}

//move this to a xml configuration file
var getPushCertPassword = function() {
	return "shan130474";
}

var getPushCertPath = function() {
	return "E://Mobile//iOS_MDM_Impl//keys//PlainCert.pfx";
} 

var initAPNS = function(pathPushCert, pushCertPassword, deviceToken, magicToken) {

	try {
		var apnsInitiator = new Packages.com.wso2mobile.ios.apns.PushNotificationSender(pathPushCert, pushCertPassword);

		var userData = new Packages.java.util.ArrayList();
		var params = new Packages.java.util.HashMap();
		params.put("devicetoken", deviceToken);
		params.put("magictoken", magicToken);
		userData.add(params);

		apnsInitiator.pushToAPNS(userData);

	} catch (e) {
		log.error(e);
	}
}

var loadPayload = function(operationCode, identifier) {
	
	var log = new Log();
	var operation = "";
	var paramMap = new Packages.java.util.HashMap();
	paramMap.put("CommandUUID", identifier);
	var isProfile = false;
	
	log.error("operationCode >>>>>>>>>>>>>>>>>> " + operationCode);	
	
	if(operationCode == "503A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.DEVICE_LOCK;
	} else if(operationCode == "505A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.CLEAR_PASSCODE;
	} else if(operationCode == "502A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.APPLICATION_LIST;
	} else if(operationCode == "500A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.DEVICE_INFORMATION;
	} else if(operationCode == "508A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.CAMERA_SETTINGS;
	} else if(operationCode == "507A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.WIFI_SETTINGS;
	} else if(operationCode == "512A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.APN_SETTINGS;
	} else if(operationCode == "518A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.WEBCLIP;
	} else if(operationCode == "519A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.PASSCODE_POLICY;
	} else if(operationCode == "520A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.EMAIL_CONFIGURATIONS;
	} else if(operationCode == "521A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.CAL_DAV;
	} else if(operationCode == "525A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.CAL_SUBSCRIPTION;
	} else if(operationCode == "") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.VPN_CERT;
	} else if(operationCode == "VPN") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.VPN_SECRET;
	} else if(operationCode == "524A") {
		operation = Packages.com.wso2mobile.ios.mdm.payload.PayloadType.LDAP;
	}
	
	try {
		var payloadLoader = new Packages.com.wso2mobile.ios.mdm.payload.PayloadLoader();
		var responseData = payloadLoader.loadPayload(operation, paramMap, isProfile);	
	} catch (e) {
		log.error(e);
	}
			
	return responseData;
}
