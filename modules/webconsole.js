var TENANT_CONFIGS = 'tenant.configs';
var USER_MANAGER = 'user.manager';
var webconsole = (function () {

    var groupModule = require('group.js').group;
    var group = '';

    var routes = new Array();
    var log = new Log();
    var db;
    var module = function (dbs) {
        group = new groupModule();
        db = dbs;
        //mergeRecursive(configs, conf);
    };
    var carbon = require('carbon');
    var server = function(){
        return application.get("SERVER");
    }
	var common = require('common.js');


    var configs = function (tenantId) {
        var configg = application.get(TENANT_CONFIGS);
        if (!tenantId) {
            return configg;
        }
        return configs[tenantId] || (configs[tenantId] = {});
    };

    var userManager = function (tenantId) {
        var config = configs(tenantId);
        if (!config || !config[USER_MANAGER]) {
            var um = new carbon.user.UserManager(server, tenantId);
            config[USER_MANAGER] = um;
            return um;
        }
        return configs(tenantId)[USER_MANAGER];
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
        getDevicesCountAndUserCountForAllGroups: function(ctx) {
            log.info("Test function getDevicesCountAndUserCountForAllGroups");
        	var um = userManager(common.getTenantID());
            var arrRole = new Array();
            var allGroups = group.getAllGroups({});
            for(var i = 0; i < allGroups.length; i++) {
                var objRole = {};
                objRole.name = allGroups[i];
                var userList = um.getUserListOfRole(allGroups[i]);
                objRole.no_of_users = userList.length;
                var deviceCountAll = 0;
                for(var j = 0; j < userList.length; j++) {
                    var resultDeviceCount = db.query("SELECT COUNT(id) AS device_count FROM devices WHERE user_id = ? AND tenant_id = ?",
                        String(userList[j]), common.getTenantID());
                    deviceCountAll += parseInt(resultDeviceCount[0].device_count);
                }
                objRole.no_of_devices = deviceCountAll;
                arrRole.push(objRole);
            }
            return arrRole;
        },
        getDevices:function(ctx){//return device information
            log.info("User name :"+ctx.username);
            log.info("platform :"+ctx.platform_id);
            log.info("byod :"+ctx.byod);
            var userId = '';
            if(ctx.username != undefined && ctx.username != null){
                userId = ctx.username;
            }
            var platformId = ctx.platform_id;

            var byod = ctx.byod;
            var result = '';

            var totalDisplayRecords = 10;

            if(byod!= undefined && byod != null && byod != '' && platformId!= undefined && platformId != null && platformId != ''){
                result = db.query("select devices.id as id, devices.properties as properties, devices.user_id as user_id, platforms.name as name, devices.os_version as os_version, devices.created_date as created_date from devices, platforms  where platforms.id = devices.platform_id && devices.user_id like '%"+userId+"%' && byod ="+byod+" && platform_id = "+platformId);
                log.info("TTT"+stringify(result[0].d));
                var totalRecords = result.length;
                var upperBound = (ctx.iDisplayStart+1)*totalDisplayRecords;
                var lowerBound =  upperBound - totalDisplayRecords;

                var dataArray = new Array();
                for(var i = lowerBound; i < upperBound; i++){
                    if(totalRecords - 1 < i){
                        break;
                    }
                    var device = [];
                    log.info(result[i].id);
                    device.push( result[i].id);
                    device.push( parse(result[i].properties).imei);
                    device.push( result[i].user_id);
                    device.push( result[i].name);
                    device.push( result[i].os_version);
                    device.push( parse(result[i].properties).device);
                    device.push( result[i].created_date);
                    dataArray.push(device);
                }
                var finalObj = {};
                finalObj.sEcho = ctx.sEcho;
                finalObj.iTotalRecords = totalRecords
                finalObj.iTotalDisplayRecords = totalDisplayRecords;
                finalObj.aaData = dataArray;
                return finalObj;
            }else if(byod!= undefined && byod != null && byod != '' ){
                result = db.query("select devices.id as id, devices.properties as properties, devices.user_id as user_id, platforms.name as name, devices.os_version as os_version, devices.created_date as created_date from devices,platforms where platforms.id = devices.platform_id && devices.user_id like '%"+userId+"%' && byod ="+byod);
                var totalRecords = result.length;
                var upperBound = (ctx.iDisplayStart+1) *totalDisplayRecords;
                var lowerBound =  upperBound - totalDisplayRecords;

                var dataArray = new Array();
                for(var i = lowerBound; i < upperBound; i++){
                    if(totalRecords - 1 < i){
                        break;
                    }
                    var device = [];
                    device.push( result[i].id);
                    device.push( parse(result[i].properties).imei);
                    device.push( result[i].user_id);
                    device.push( result[i].name);
                    device.push( result[i].os_version);
                    device.push( parse(result[i].properties).device);
                    device.push( result[i].created_date);
                    dataArray.push(device);
                }
                var finalObj = {};
                finalObj.sEcho = ctx.sEcho;
                finalObj.iTotalRecords = totalRecords
                finalObj.iTotalDisplayRecords = totalDisplayRecords;
                finalObj.aaData = dataArray;
                return finalObj;
            }else if(platformId!= undefined && platformId != null && platformId != ''){
                log.info("test platform"+platformId);
                result = db.query("select devices.id as id, devices.properties as properties, devices.user_id as user_id, platforms.name as name, devices.os_version as os_version, devices.created_date as created_date from devices,platforms where platforms.id = devices.platform_id && devices.user_id like '%"+userId+"%' && platform_id = "+platformId);

                var totalRecords = result.length;
                log.info("totalDisplayRecords"+totalDisplayRecords);
                log.info("iDisplayStart  :"+ctx.iDisplayStart);
                var upperBound = (ctx.iDisplayStart+1) *totalDisplayRecords;
                log.info("upperBound"+upperBound);
                var lowerBound =  upperBound - totalDisplayRecords;
                log.info("lowerBound"+lowerBound);
                var dataArray = new Array();
                for(var i = lowerBound; i < upperBound; i++){
                    log.info(stringify(result[i]));
                    if(totalRecords - 1 < i){
                        break;
                    }
                    var device = [];
                    device.push( result[i].id);
                    device.push( parse(result[i].properties).imei);
                    device.push( result[i].user_id);
                    device.push( result[i].name);
                    device.push( result[i].os_version);
                    device.push( parse(result[i].properties).device);
                    device.push( result[i].created_date);
                    dataArray.push(device);
                }
                var finalObj = {};
                finalObj.sEcho = ctx.sEcho;
                finalObj.iTotalRecords = totalRecords
                finalObj.iTotalDisplayRecords = totalDisplayRecords;
                finalObj.aaData = dataArray;
                return finalObj;
            }else{
                result = db.query("select devices.id as id, devices.properties as properties, devices.user_id as user_id, platforms.name as name, devices.os_version as os_version, devices.created_date as created_date   from devices,platforms where platforms.id = devices.platform_id && devices.user_id like '%"+userId+"%'");
                var totalRecords = result.length;
                var upperBound = (ctx.iDisplayStart+1)*totalDisplayRecords;
                var lowerBound =  upperBound - totalDisplayRecords;
                var dataArray = new Array();
                for(var i = lowerBound ;i < upperBound; i++){
                    if(totalRecords - 1 < i){
                        break;
                    }
                    var device = [];
                    device.push( result[i].id);
                    device.push( parse(result[i].properties).imei);
                    device.push( result[i].user_id);
                    device.push( result[i].name);
                    device.push( result[i].os_version);
                    device.push( parse(result[i].properties).device);
                    device.push( result[i].created_date);
                    dataArray.push(device);
                }
                var finalObj = {};
                finalObj.sEcho = ctx.sEcho;
                finalObj.iTotalRecords = totalRecords
                finalObj.iTotalDisplayRecords = totalDisplayRecords;
                finalObj.aaData = dataArray;
                return finalObj;
            }
        }
    };
    return module;
})();