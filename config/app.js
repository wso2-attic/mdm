var log = new Log();

var db = application.get('db');
if(db==null || db==undefined){
    //db = new Database(dbconfig.server,dbconfig.username,dbconfig.password);
    db = new Database("EMM_DB");
    application.put('db',db);
}

var app_TENANT_CONFIGS = 'tenant.configs';
var app_carbon = require('carbon');
var app_configs = require('mdm.js').config();

var app_server = new app_carbon.server.Server({
    tenanted: app_configs.tenanted,
    url: app_configs.HTTPS_URL + '/admin'
});
application.put("SERVER", app_server);
application.put(app_TENANT_CONFIGS, {});

var deviceModule = require('../modules/device.js').device;
var device = new deviceModule(db);
//device.invokePendingOperations();

var policyModule = require('../modules/policy.js').policy;
var policy = new policyModule(db);
policy.monitoring({});

var groupModule = require('../modules/group.js').group;
var group = new groupModule(db);
var groupName = 'mdmadmin';
var userList = new Array();
group.addGroup({'name':groupName,'users':userList});

var androidConfig = require('android.json');

var gcm = require('gcm').gcm;
gcm.setApiKey(androidConfig.api_key);

/*var deviceModule = require('../modules/device.js').device;
var device = new deviceModule(db);
device.monitoring({});*/


//var policy = require('policy');
//log.info(policy.policy.init());
//policy.entitlement.login();
//log.info("Test Init Script");

