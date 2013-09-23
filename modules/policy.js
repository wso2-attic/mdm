
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

        updatePolicy:function(ctx){
            var result;
            var policy = db.query("SELECT * FROM policies where name = ?",ctx.policyName);
            if(policy!= undefined && policy != null && policy[0] != undefined && policy[0] != null){
                log.info("Content >>>>>"+stringify( ctx.policyData));
                result = db.query("UPDATE policies SET content= ? WHERE name = ?",ctx.policyData,ctx.policyName);
                log.info("Result >>>>>>>"+result);
            }else{
                result = this.addPolicy(ctx);
            }
            return result;
        },
        addPolicy: function(ctx){
            var result = db.query("insert into policies (name,content) values (?,?)",ctx.policyName,ctx.policyData);
            log.info("Result >>>>>>>"+result);
            return result;
        },
        getAllPolicies:function(ctx){
            var result = db.query("SELECT * FROM policies");
            return result;
        },
        getPolicy:function(ctx){
            var result = db.query("SELECT * FROM policies where id = ?",ctx.policyid);
            return result[0];
        },
        deletePolicy:function(ctx){
            var result = db.query("DELETE FROM policies where id = ?",ctx.policyid);
            return result;
        },
        assignGroupsToPolicy:function(ctx){
            var deletedGroups = ctx.removed_groups;
            var newGroups = ctx.added_groups;
            var policyId = ctx.policyid;

            for(var i = 0; i< deletedGroups.length;i++){
                var result = db.query("DELETE FROM group_policy_mapping WHERE group_policy_mapping.policy_id = ? && group_policy_mapping.group_id = ? ",policyId,deletedGroups[i]);
                log.info("Result1 >>>>>"+result);
            }
            for(var i = 0; i< newGroups.length;i++){
                try{
                    var result =db.query(" INSERT INTO group_policy_mapping (group_id,policy_id) VALUES (?,?)",newGroups[i],policyId);
                    log.info("Result2 >>>>>"+result);
                }catch(e){
                    log.info("ERROR Occured >>>>>");
                }
            }
        },
        getGroupsByPolicy:function(ctx){
            var allGroups = group.getGroups(ctx);
            var result = db.query("SELECT * FROM group_policy_mapping WHERE group_policy_mapping.policy_id = ? ",ctx.policyid);

            var array = new Array();
            if(result == undefined || result == null || result[0] == undefined || result[0] == null){
                for(var i =0; i < allGroups.length;i++){
                    var element = {};
                    element.name = allGroups[i];
                    element.available = false;
                    array[i] = element;
                }
            }else{
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
            }
            log.info(array);
            return array;
        },
        enforcePolicy:function(ctx){
            var policies = db.query("SELECT * from group_policy_mapping where policy_id=?",ctx.policy_id);
            var policyData = policies[0].content;

            var result = db.query("SELECT * from group_policy_mapping where policy_id=?",ctx.policy_id);
            var groupId = result[0].group_id;
            var users = group.getUsers({'groupid':groupId});
            for(var i=0;i<users.length;i++){
                user.operation({'userid': users[i].username,'operation':'POLICY','data':parse(policyData)});
            }
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