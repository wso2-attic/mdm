var common = require('/modules/common.js');
var translate = function(results){

    var result;
    var field;
    var models = [];
    // var model;
    // for (var index in results) {
    //     result = results[index];
    //     for (var prop in result) {
    //        	prop = prop.toUpperCase();
    //     }
    //     models.push(model);
    // }
    // log.info(models);

    for (var prop in results){
    	if(results.hasOwnProperty(prop)){
    		var result = results[prop];
    		for(var propIn in result){
    			var model = {}
    			if(result.hasOwnProperty(propIn)){
    				// log.info(propIn.toUpperCase());
    				model[propIn.toUpperCase()] = result[propIn];
    				models.push(model);
    			}
    		}
    	}
    }
    log.info(models);

    return models;
}
var driver = {
	execute : function(){
		var query  = arguments[0];
		var args = Array.prototype.slice.call(arguments, 0);
		var argumentArray = args.slice(1, args.length);
        if (argumentArray.length>0) {
        	var db = common.getDatabase();
            result = db.query.apply(db, arguments) || [];
        }
        else {
            result = common.getDatabase().query(query) || [];
        }
        var processed = translate(result);
        return processed;
	}
};

 
