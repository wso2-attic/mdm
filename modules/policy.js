
var policy = (function () {

    var userModule = require('user.js').user;
    var user;

    var groupModule = require('group.js').group;
    var group;

    var configs = {
        CONTEXT: "/"
    };
    var routes = new Array();
    var log = new Log();
    var db;

    var module = function (dbs) {
        db = dbs;
        user = new userModule(db);
        group = new groupModule(db);
        //mergeRecursive(configs, conf);
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

        addPolicy: function(ctx){
            var result = db.query("insert into policies (name,content) values (?,?)",ctx.policyName,ctx.policyData);
            log.info("Result >>>>>>>"+result);
            return result;
        },
        getAllPolicies:function(ctx){
            var result = db.query("SELECT * FROM policies");
            return result;
        },
        deletePolicy:function(ctx){
            var result = db.query("REMOVE FROM permissions where name = ?",ctx.name);
            return result;
        },
        assignGroupsToPolicy:function(ctx){
            //var result = db.query("INSERT INTO group_policy_mapping (user_id,policy_id) values (?,?)",ctx.uid,ctx.pid);
            return result;
        },
        getGroupsByPolicy:function(ctx){
            var allGroups = group.getGroups(ctx);
            var result = db.query("SELECT * FROM group_policy_mapping WHERE group_policy_mapping.policy_id = ? ",ctx.policyid);

            var array = new Array();
            for(var i =0; i < allGroups.length;i++){
                var element = {};
                for(var j=0 ;j< result.length;j++){
                    if(allGroups[i]==result[j].group_id){
                        element.name = allGroups[i];
                        element.available = true;
                        break;
                    }else{
                        element.name = allGroups[i];
                        element.available = false;
                    }
                }
                array[i] = element;
            }
            log.info(array);
            return array;
        },
        removePolicyFromGroup:function(ctx){
        //    var result = db.query("INSERT INTO group_policy_mapping (user_id,policy_id) values (?,?)",ctx.uid,ctx.pid);
        //    return result;
        },
        assignPolicyToUser:function(ctx){

            return result;
        }

    };
    // return module
    return module;
})();