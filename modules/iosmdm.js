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
		getCA : function() {
			try {
				var keystoreReader = new Packages.com.wso2mobile.ios.mdm.impl.KeystoreReader();
				var caCertificate = keystoreReader.getCACertificate();
				return caCertificate.getEncoded();
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
		handleProfileRequest : function(inputStream) {

			try {
				var requestHandler = new Packages.com.wso2mobile.ios.mdm.impl.RequestHandler();
				var signedData = requestHandler.handleProfileRequest(inputStream);

				return signedData;
			} catch (e) {
				log.error(e);
			}

			return null;
		},
		getCACert : function(caPath, raPath) {

			try {
				var requestHandler = new Packages.com.wso2mobile.ios.mdm.impl.RequestHandler();
				var scepResponse = requestHandler.handleGetCACert();

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
		getPKIMessage : function(inputStream) {

			try {
				var certGenerator = new Packages.com.wso2mobile.ios.mdm.impl.CertificateGenerator();
				var pkiMessage = certGenerator.getPKIMessage(inputStream);

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
				var checkinMessageType = plistExtractor.extractTokens(contentString);

                log.debug("CheckinMessageType >>>>>>>>>>>>>>>>>>>>>> " + checkinMessageType.getMessageType());

				if (checkinMessageType.getMessageType() == "CheckOut") {
					var ctx = {};
					ctx.udid = checkinMessageType.getUdid();
					device.unRegisterIOS(ctx);
				} else if (checkinMessageType.getMessageType() == "TokenUpdate") {
					var tokenProperties = {};
					tokenProperties["token"] = checkinMessageType.getToken();
					tokenProperties["unlockToken"] = checkinMessageType.getUnlockToken();
					tokenProperties["magicToken"] = checkinMessageType.getPushMagic();
					tokenProperties["deviceid"] = checkinMessageType.getUdid();

					device.updateiOSTokens(tokenProperties);
				}

			} catch (e) {
				log.error(e);
			}
		},
		sendPushNotifications : function(inputStream) {

			var writer = new Packages.java.io.StringWriter();
			Packages.org.apache.commons.io.IOUtils.copy(inputStream, writer, "UTF-8");
			var contentString = writer.toString();

			//log.error(contentString);

			try {
				var plistExtractor = new Packages.com.wso2mobile.ios.mdm.plist.PlistExtractor();
				var apnsStatus = plistExtractor.extractAPNSResponse(contentString);

				var commandUUID = apnsStatus.getCommandUUID();

                log.debug("APNSTATUS >>>>> " + apnsStatus.getStatus());

				if (("Acknowledged").equals(apnsStatus.getStatus())) {
					log.error("Acknowledged >>>>>>>>>>>>>>>>" + apnsStatus.getOperation());

					var responseData = "";

					if ("QueryResponses" == apnsStatus.getOperation()) {
						responseData = apnsStatus.getResponseData();
					} else if ("InstalledApplicationList" == apnsStatus.getOperation()) {
						responseData = apnsStatus.getResponseData();
					} else if ("ProfileList" == apnsStatus.getOperation()) {
						responseData = apnsStatus.getResponseData();
					} else if ("NeedsRedemption" == apnsStatus.getState()) {
						log.error("NeedsRedemption >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ");
						
						var notifications = db.query("SELECT device_id, message FROM notifications WHERE id = ?", commandUUID);
						var device_id = notifications[0].device_id;
						var message = notifications[0].message;
						message = parse(message);
						
						responseData = apnsStatus.getResponseData();
						var data = {};
						data.identifier = responseData.identifier;
						data.redemptionCode = message.redemptionCode;
						device.sendMessageToIOSDevice({'deviceid':device_id, 'operation': "APPLYREDEMPTIONCODE", 'data': data});
					}

					var ctx = {};
					ctx.data = responseData;
					ctx.msgID = commandUUID;

					var pendingExist = notification.addIosNotification(ctx);
					
					ctx = {};
					ctx.id = commandUUID;
					notification.discardOldNotifications(ctx);

//                    if (pendingExist != true) {
//                        log.debug("Pending Exist >>>>>>> FALSE");
//                        return;
//                    }
//                    log.debug("Pending Exist >>>>>>> TRUE");

				} else if (("Error").equals(apnsStatus.getStatus())) {
					log.error("Error " + apnsStatus.getError());

					var ctx = {};
					ctx.error = "Error";
					ctx.data = apnsStatus.getError();
					ctx.msgID = commandUUID;

                    var pendingExist = notification.addIosNotification(ctx);

//                    if (pendingExist != true) {
//                        log.debug("Pending Exist >>>>>>> FALSE");
//                        return;
//                    }
//                    log.debug("Pending Exist >>>>>>> TRUE");
				}

				var ctx = {};
				ctx.udid = stringify(apnsStatus.getUdid());
				var operation = device.getPendingOperationsFromDevice(ctx);

				if (operation != null && operation.feature_code.indexOf("-") > 0) {
					var featureCode = operation.feature_code.split("-")[0];
                    log.debug("sendPushNotifications >>> Feature Code >>>>>> " + featureCode);

					return common.loadPayload(new Packages.java.lang.String(operation.id), featureCode, operation.message);
				} else if (operation != null) {
					return common.loadPayload(new Packages.java.lang.String(operation.id), operation.feature_code, operation.message);
				}

                //End of all Notifications pending for the device
                var datetime =  common.getCurrentDateTime();
                log.debug("UPDATE device_awake status >>>>>>>> ");
                db.query("UPDATE device_awake JOIN devices ON devices.id = device_awake.device_id SET device_awake.status = 'P', device_awake.processed_date = ? WHERE devices.udid = ? AND device_awake.status = 'S'", datetime, apnsStatus.getUdid());

                return null;

			} catch (e) {
				log.error(e);
			}
		},
		initAPNS : function(deviceToken, magicToken) {

			try {
				var apnsInitiator = new Packages.com.wso2mobile.ios.apns.PushNotificationSender();

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
