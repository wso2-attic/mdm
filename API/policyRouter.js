var policy = (function () {


    var module = function (db,router) {
        var policyModule = require('modules/policy.js').policy;
        var policy = new policyModule(db);

        router.post('policy/', function(ctx){

            log.info("check policy router POST");
            log.info(ctx);
            var result = policy.addPolicy(ctx);
            if(result == 'success'){
                response.status = 200;
            }else{
                response.status = 404;
            }

        });

        router.put('policy/', function(ctx){
            log.info("check policy router add permission group PUT");
            log.info(ctx);
            var result = policy.addPermissionGroup(ctx);
            if(result != 'undefined' && result != null){
                response.status = 200;
                response.content = result;
            }else{
                response.status = 404;
            }

        });

        router.get('policy/', function(ctx){
            log.info("check policy router GET");
            log.info(ctx);
            var result = policy.getAllPermissionGroups(ctx);
            log.info(result);
            if(result != 'undefined' && result != null && result[0] != null){
                response.status = 200;
                response.content = result;
            }else{
                response.status = 404;
            }

        });

        router.delete('policy/{policyid}', function(ctx){
            policy.delete(ctx);
            response.status = 201;
            return true;
        });

    };
    // prototype
    module.prototype = {
        constructor: module
    };
    // return module
    return module;
})();