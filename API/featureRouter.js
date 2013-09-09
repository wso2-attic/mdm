var feature = (function () {

    var module = function (db,router) {
        var featureModule = require('modules/feature.js').feature;
        var feature = new featureModule(db);
        router.get('features/', function(ctx){
            var features= feature.getAllFeaturesForRoles(ctx);
            if(features[0]!=null){
                response.content = features;
                response.status = 200;
            }else{
                response.status = 404;
            }
        });
    };
    // prototype
    module.prototype = {
        constructor: module
    };
    // return module
    return module;
})();