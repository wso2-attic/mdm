var log = new Log();

var db = application.get('db');
var dbconfig = require('db.json');
if(db==null || db==undefined){
    db = new Database(dbconfig.server,dbconfig.username,dbconfig.password);
    application.put('db',db);
}

var app_TENANT_CONFIGS = 'tenant.configs';
var app_carbon = require('carbon');
var app_configs = require('mdm.js').config();
//Init for all the global objects
var app_server = new app_carbon.server.Server({
    tenanted: app_configs.tenanted,
    url: app_configs.HTTPS_URL + '/admin'
});
application.put("SERVER", app_server);
application.put(app_TENANT_CONFIGS, {});

var policyModule = require('../modules/policy.js').policy;
var policy = new policyModule(db);
policy.monitoring({});

