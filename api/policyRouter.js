var policy = (function () {


    var module = function (db,router) {
        var policyModule = require('modules/policy.js').policy;
        var policy = new policyModule(db);

        router.post('policies/', function(ctx){

            log.info("check policy router POST");
            log.info(ctx);
            var result = policy.addPolicy(ctx);
            if(result == 'success'){
                response.status = 200;
            }else{
                response.status = 404;
            }

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