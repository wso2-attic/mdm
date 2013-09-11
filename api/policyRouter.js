var policy = (function () {


    var module = function (db,router) {
        var policyModule = require('modules/policy.js').policy;
        var policy = new policyModule(db);

        router.post('policies/', function(ctx){

            log.info("check policy router POST");
            log.info(ctx);
            var result = policy.addPolicy(ctx);
            if(result == 1){
                response.status = 200;
            }else{
                response.status = 404;
            }

        });
        router.get('policies/', function(ctx){

            log.info("check policy router GET");
            log.info(ctx);
            var result = policy.getAllPolicies(ctx);
            if(result != undefined && result != null && result[0] != undefined && result[0]!= null){
                response.content = result;
                response.status = 200;
            }else{
                response.status = 404;
            }

        });
        router.put('policies/{policyid}/groups', function(ctx){

            log.info("check policy router GET");
            log.info(ctx);
            var result = policy.getAllPolicies(ctx);
            if(result != undefined && result != null && result[0] != undefined && result[0]!= null){
                response.content = result;
                response.status = 200;
            }else{
                response.status = 404;
            }

        });
        router.get('policies/{policyid}/groups', function(ctx){

            var result = policy.getGroupsByPolicy(ctx);

        });




        router.delete('policies/{policyid}', function(ctx){
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