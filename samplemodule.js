
var group = (function () {



	
    var module = function () {
		log.info("hi2");
    };


	
    // prototype
    module.prototype = {
        constructor: module,
		sayHi: function(ctx){
			log.info("hi1");
		}
    };


    return module;
})();