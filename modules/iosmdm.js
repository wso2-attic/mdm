var iosmdm = (function() {

	var log = new Log();
	var deviceModule = require('/modules/device.js').device;
	var db = application.get('db');
	var device = new deviceModule(db);
	var common = require("/modules/common.js");
	var notificationModule = require('/modules/notification.js').notification;
	var notification = new notificationModule(db);

	var module = function() {

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


	module.prototype = {
		constructor : module,
		getCA : function(caPath) {
			try {
				var fileInputStream = new Packages.java.io.FileInputStream(caPath);

				return new Packages.org.apache.commons.io.IOUtils.toByteArray(fileInputStream);
			} catch (e) {
				log.error(e);
			}

			return null;
		},
		generateMobileConfigurations : function(token) {
			try {
				var plistGenerator = new Packages.com.wso2mobile.ios.mdm.plist.PlistGenerator();
				var result = plistGenerator.generateMobileConfigurations(token);
				var data = result.getBytes();

				var pkcsSigner = new Packages.com.wso2mobile.ios.mdm.impl.PKCSSigner();
				var signedData = pkcsSigner.getSignedData(data);

				return signedData;
			} catch (e) {
				log.error(e);
			}

			return null;
		},
		handleProfileRequest : function(inputStream, caPath, caPrivateKeyPath, token) {

			try {
				var requestHandler = new Packages.com.wso2mobile.ios.mdm.impl.RequestHandler();
				var signedData = requestHandler.handleProfileRequest(inputStream, caPath, caPrivateKeyPath, token);

				return signedData;
			} catch (e) {
				log.error(e);
			}

			return null;
		},
		getCACert : function(caPath, raPath) {

			try {
				var requestHandler = new Packages.com.wso2mobile.ios.mdm.impl.RequestHandler();
				var scepResponse = requestHandler.handleGetCACert(caPath, raPath);

				return scepResponse;
			} catch (e) {
				log.error(e);
			}

			return null;
		},
		getCACaps : function() {

			var postBodyCACaps = "POSTPKIOperation\nSHA-1\nDES3\n";
			var strPostBodyCACaps = new Packages.java.lang.String(postBodyCACaps);

			return strPostBodyCACaps.getBytes();

		},
		getPKIMessage : function(inputStream, caPath, caPrivateKeyPath, raPath, raPrivateKeyPath) {

			try {
				var certGenerator = new Packages.com.wso2mobile.ios.mdm.impl.CertificateGenerator();
				var pkiMessage = certGenerator.getPKIMessage(inputStream, caPath, caPrivateKeyPath, raPath, raPrivateKeyPath);

				return pkiMessage;
			} catch (e) {
				log.error(e);
			}

		},
		extractDeviceTokens : function(inputStream) {

			var writer = new Packages.java.io.StringWriter();
			Packages.org.apache.commons.io.IOUtils.copy(inputStream, writer, "UTF-8");
			var contentString = writer.toString();

			try {
				var plistExtractor = new Packages.com.wso2mobile.ios.mdm.plist.PlistExtractor();
				var tokenUpdate = plistExtractor.extractTokens(contentString);

				var tokenProperties = {};
				tokenProperties["token"] = tokenUpdate.getToken();
				tokenProperties["unlockToken"] = tokenUpdate.getUnlockToken();
				tokenProperties["magicToken"] = tokenUpdate.getPushMagic();
				tokenProperties["deviceid"] = tokenUpdate.getUdid();

				device.updateiOSTokens(tokenProperties);

			} catch (e) {
				log.error(e);
			}
		},
		sendPushNotifications : function(inputStream) {

			var writer = new Packages.java.io.StringWriter();
			Packages.org.apache.commons.io.IOUtils.copy(inputStream, writer, "UTF-8");
			var contentString = writer.toString();

			log.error(contentString);

			try {
				var plistExtractor = new Packages.com.wso2mobile.ios.mdm.plist.PlistExtractor();
				var apnsStatus = plistExtractor.extractAPNSResponse(contentString);

				if (("Acknowledged").equals(apnsStatus.getStatus())) {
					log.error("Acknowledged >>>>>>>>>>>>>>>>");

					var commandUUID = apnsStatus.getCommandUUID();
					var responseData = "";

					log.error(apnsStatus.getOperation());
					log.error(apnsStatus.getResponseData());

					if ("QueryResponses" == apnsStatus.getOperation()) {
						responseData = apnsStatus.getResponseData();
					} else if ("InstalledApplicationList" == apnsStatus.getOperation()) {
						responseData = apnsStatus.getResponseData();
					} else {

					}

					var ctx = {};
					ctx.data = responseData;
					ctx.msgID = commandUUID;

					notification.addIosNotification(ctx);

					return;
				}

				var ctx = {};
				ctx.udid = stringify(apnsStatus.getUdid());
				var operation = device.getPendingOperationsFromDevice(ctx);

				if (operation != null) {
					return common.loadPayload(new Packages.java.lang.String(operation.id), 
						operation.feature_code, operation.message);
				}

				return null;

			} catch (e) {
				log.error(e);
			}
		},
		initAPNS : function(pathPushCert, pushCertPassword, deviceToken, magicToken) {

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
	};

	return module;
})();
