
var policy = (function () {

    var userModule = require('user.js').user;
    var user;

    var groupModule = require('group.js').group;
    var group;

    var deviceModule = require('device.js').device;
    var device

    var common = require("common.js");


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
        device = new deviceModule(db);
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

   function monitor(ctx){

        var result = db.query("SELECT * from devices");

        for(var i=0; i<result.length; i++){

            var deviceId = result[i].id;
            var operation = 'MONITORING';
            var data = {};
            var userId = result[i].user_id;
            var roleList = user.getUserRoles({'username':'kasun@wso2mobile.com'});
            var gpresult = db.query("SELECT policies.content as data, policies.type FROM policies,group_policy_mapping where policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",roleList[0]);
            var jsonData = parse(gpresult[0].data);
            jsonData = deviceModule.policyByOsType(jsonData);
            var obj = {};
            obj.type = gpresult[0].type;
            obj.policies = jsonData;
            device.sendToDevice({'deviceid':deviceId,'operation':operation,'data':obj});
            device.sendToDevice({'deviceid':deviceId,'operation':'INFO','data':{}});
            device.sendToDevice({'deviceid':deviceId,'operation':'APPLIST','data':{}});
        }
    }

    // prototype
    module.prototype = {
        constructor: module,

        updatePolicy:function(ctx){
            var result;
            var policy = db.query("SELECT * FROM policies where name = ?",ctx.policyName);
            if(policy!= undefined && policy != null && policy[0] != undefined && policy[0] != null){
                log.info("Content >>>>>"+stringify( ctx.policyData));
                result = db.query("UPDATE policies SET content= ?,type = ? WHERE name = ?",ctx.policyData, ctx.policyType, ctx.policyName);
                log.info("Result >>>>>>>"+result);
            }else{
                result = this.addPolicy(ctx);
            }
            return result;
        },
        addPolicy: function(ctx){
            var result = db.query("insert into policies (name,content,type) values (?,?,?)",ctx.policyName,ctx.policyData,ctx.policyType);
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
        assignUsersToPolicy:function(ctx){
            var deletedUsers = ctx.removed_users;
            var newUsers = ctx.added_users;
            var policyId = ctx.policyid;

            for(var i = 0; i< deletedUsers.length;i++){
                var result = db.query("DELETE FROM user_policy_mapping WHERE user_policy_mapping.policy_id = ? && user_policy_mapping.group_id = ? ",policyId,deletedGroups[i]);
                log.info("Result1 >>>>>"+result);
            }
            for(var i = 0; i< newGroups.length;i++){
                try{
                    var result =db.query(" INSERT INTO user_policy_mapping (user_id,policy_id) VALUES (?,?)",newUsers[i],policyId);
                    log.info("Result2 >>>>>"+result);
                }catch(e){
                    log.info("ERROR Occured >>>>>");
                }
            }
        },
        assignUsersToPolicy:function(ctx){
            var deletedUsers = ctx.removed_users;
            var newUsers = ctx.added_users;
            var policyId = ctx.policyid;

            for(var i = 0; i< deletedUsers.length;i++){
                var result = db.query("DELETE FROM user_policy_mapping WHERE user_policy_mapping.policy_id = ? && user_policy_mapping.group_id = ? ",policyId,deletedGroups[i]);
                log.info("Result1 >>>>>"+result);
            }
            for(var i = 0; i< newGroups.length;i++){
                try{
                    var result =db.query(" INSERT INTO user_policy_mapping (user_id,policy_id) VALUES (?,?)",newUsers[i],policyId);
                    log.info("Result2 >>>>>"+result);
                }catch(e){
                    log.info("ERROR Occured >>>>>");
                }
            }
        },
        assignPlatformToPolicy:function(ctx){
            var deletedPlatforms = ctx.removed_platforms;
            var newPlatforms = ctx.added_platforms;
            var policyId = ctx.policyid;

            for(var i = 0; i< deletedPlatforms.length;i++){
                var result = db.query("DELETE FROM platform_policy_mapping WHERE platform_policy_mapping.policy_id = ? && platform_policy_mapping.platform_id = ? ",policyId,deletedPlatform[i]);
                log.info("Result1 >>>>>"+result);
            }
            for(var i = 0; i< newPlatforms.length;i++){
                try{
                    var result =db.query(" INSERT INTO platform_policy_mapping (platform_id,policy_id) VALUES (?,?)",newPlatforms[i],policyId);
                    log.info("Result2 >>>>>"+result);
                }catch(e){
                    log.info("ERROR Occured >>>>>");
                }
            }
        },
        getGroupsByPolicy:function(ctx){
            var allGroups = group.getAllGroups(ctx);
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

            return array;
        },
        getUsersByPolicy:function(ctx){
            var allUsers = user.getAllUsers(ctx);
            var result = db.query("SELECT * FROM user_policy_mapping WHERE user_policy_mapping.policy_id = ? ",ctx.policyid);

            var array = new Array();
            if(result == undefined || result == null || result[0] == undefined || result[0] == null){
                for(var i =0; i < allUsers.length;i++){
                    var element = {};
                    element.name = allUsers[i].username;
                    element.available = false;
                    array[i] = element;
                }
            }else{
                for(var i =0; i < allUsers.length;i++){
                    var element = {};
                    for(var j=0 ;j< result.length;j++){
                        if(allUsers[i]==result[j].user_id){
                            element.name = allUsers[i].username;
                            element.available = true;
                            break;
                        }else{
                            element.name = allUsers[i].username;
                            element.available = false;
                        }
                    }
                    array[i] = element;
                }
            }

            return array;
        },
        getPlatformsByPolicy:function(ctx){
            var allPlatforms =new Array('android','ios');
            var result = db.query("SELECT * FROM platform_policy_mapping WHERE platform_policy_mapping.policy_id = ? ",ctx.policyid);

            var array = new Array();
            if(result == undefined || result == null || result[0] == undefined || result[0] == null){
                for(var i =0; i < allPlatforms.length;i++){
                    var element = {};
                    element.name = allPlatforms[i];
                    element.available = false;
                    array[i] = element;
                }
            }else{
                for(var i =0; i < allPlatforms.length;i++){
                    var element = {};
                    for(var j=0 ;j< result.length;j++){
                        if(allPlatforms[i]==result[j].platform_id){
                            element.name = allPlatforms[i];
                            element.available = true;
                            break;
                        }else{
                            element.name = allPlatforms[i];
                            element.available = false;
                        }
                    }
                    array[i] = element;
                }
            }

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
        monitoring:function(ctx){
            setInterval(
                function(ctx){
                  /*  try{
                        log.info("Getting Tenant ID"+common.getTenantID());   */

                            monitor(ctx);

                 /*   }catch(e){

                        log.info("Error of Monitoring"+e);
                    } */
                }
                ,10000);

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