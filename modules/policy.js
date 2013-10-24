
var policy = (function () {

    var userModule = require('user.js').user;
    var user;

    var usergModule = require('user_group.js').user_group;
    var userg

    var groupModule = require('group.js').group;
    var group;

    var deviceModule = require('device.js').device;
    var device;

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
        userg = new usergModule(db);
        group = new groupModule(db);
        device = new deviceModule(db);
        //mergeRecursive(configs, conf);
    };

    function mergeRecursive(obj1, obj2) {
        for (var p in obj2) {
            try {
                // Property in destination object set; update its value.
                if (obj2[p].constructor == Object) {
                    obj1[p] = mergeRecursive(obj1[p], obj2[p]);
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
    function policyByOsType(jsonData,os){
        for(var n=0;n<jsonData.length;n++){
            if(jsonData[n].code == '509B'||jsonData[n].code == '528B'){
                var apps = jsonData[n].data;
                var appsByOs = new Array();
                for(var k=0;k<apps.length;k++){
                    if(apps[k].os == os){
                        appsByOs.push(apps[k]);
                    }
                }
                var obj1 = {};
                obj1.code = jsonData[n].code;
                obj1.data = appsByOs;
                jsonData[n] = obj1;
            }
        }
        return  jsonData;
    }

   function monitor(ctx){
       var db = application.get('db');
       var deviceModule1 = require('device.js').device;
       var device1 = new deviceModule1(db);

       var userModule1 = require('user.js').user;
       var user1 = new userModule1(db);

       /* var result = db.query("SELECT * from devices");

        for(var i=0; i<result.length; i++){

            var deviceId = result[i].id;
            var platform = '';
            if(result[0].platform_id == 1){
                platform = 'android';
            }else if(result[0].platform_id == 2){
                platform = 'ios';
            }
            var operation = 'MONITORING';
            var data = {};
            var userId = result[i].user_id;
            device1.sendToDevice({'deviceid':deviceId,'operation':'INFO','data':{}});
            device1.sendToDevice({'deviceid':deviceId,'operation':'APPLIST','data':{}});

            var upresult = db.query("SELECT policies.content as data, policies.type FROM policies, user_policy_mapping where policies.id = user_policy_mapping.policy_id && user_policy_mapping.user_id = ?",stringify(userId));
            if(upresult!=undefined && upresult != null && upresult[0] != undefined && upresult[0] != null ){
                log.info("Policy Payload :"+gpresult[0].data);
                var jsonData = parse(gpresult[0].data);
                jsonData = policyByOsType(jsonData,'android');
                device1.sendToDevice({'deviceid':deviceId,'operation':operation,'data':obj});
                continue;
            }

            var ppresult = db.query("SELECT policies.content as data, policies.type FROM policies,platform_policy_mapping where policies.id = platform_policy_mapping.policy_id && platform_policy_mapping.platform_id = ?",stringify(platform));
            if(ppresult!=undefined && ppresult != null && ppresult[0] != undefined && ppresult[0] != null ){
                log.info("Policy Payload :"+ppresult[0].data);
                var jsonData = parse(ppresult[0].data);
                jsonData = policyByOsType(jsonData,'android');
                device1.sendToDevice({'deviceid':deviceId,'operation':operation,'data':obj});
                continue;
            }
            log.info("UUUUUUUUUUUUUUUU"+userId); */

            var roless = user1.getUserRoles({'username':'kasun@wso2mobile.com'});
            log.info(roles[0]);
           // var roleList = user.getUserRoles({'username':userId});
           /* var role = '';
            for(var i=0;i<roleList.length;i++){
                if(roleList[i] == 'store' || roleList[i] == 'store' || roleList[i] == 'Internal/everyone'){
                    continue;
                }else{
                    role = roleList[i];
                    break;
                }
            }
            log.info(role);
            var gpresult = db.query("SELECT policies.content as data, policies.type FROM policies,group_policy_mapping where policies.id = group_policy_mapping.policy_id && group_policy_mapping.group_id = ?",role+'');
            log.info(gpresult[0]);
            if(gpresult != undefined && gpresult != null && gpresult[0] != undefined && gpresult[0] != null){
                log.info("Policy Payload :"+gpresult[0].data);
                var jsonData = parse(gpresult[0].data);
                jsonData = policyByOsType(jsonData,'android');
                device.sendToDevice({'deviceid':deviceId,'operation':operation,'data':obj});
            }*/

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
            var result = db.query("insert into policies (name,content,type,category) values (?,?,?,?)",ctx.policyName,ctx.policyData,ctx.policyType,ctx.category);
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
            db.query("DELETE FROM group_policy_mapping where policy_id = ?",ctx.policyid);
            return result;
        },
        assignGroupsToPolicy:function(ctx){
            this.assignUsersToPolicy(ctx);
            this.assignPlatformsToPolicy(ctx);
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
                var result = db.query("DELETE FROM user_policy_mapping WHERE user_policy_mapping.policy_id = ? && user_policy_mapping.user_id = ? ",policyId,deletedUsers[i]);
                log.info("Result1 >>>>>"+result);
            }
            for(var i = 0; i< newUsers.length;i++){
                try{
                    var result =db.query(" INSERT INTO user_policy_mapping (user_id,policy_id) VALUES (?,?)",newUsers[i],policyId);
                    log.info("Result2 >>>>>"+result);
                }catch(e){
                    log.info("ERROR Occured >>>>>");
                }
            }
        },
        assignPlatformsToPolicy:function(ctx){
            var deletedPlatforms = ctx.removed_platforms;
            var newPlatforms = ctx.added_platforms;
            var policyId = ctx.policyid;

            for(var i = 0; i< deletedPlatforms.length;i++){
                var result = db.query("DELETE FROM platform_policy_mapping WHERE platform_policy_mapping.policy_id = ? && platform_policy_mapping.platform_id = ? ",policyId,deletedPlatforms[i]);
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
            var totalGroups = group.getAllGroups({});
            var removeRoles = new Array("Internal/store", "Internal/publisher", "Internal/reviewer");
            var allGroups = common.removeNecessaryElements(totalGroups,removeRoles);
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
            log.info("TEst >>>"+stringify(array));
            return array;
        },
        getUsersByPolicy:function(ctx){
            var allUsers = user.getAllUsers(ctx);
            var result = db.query("SELECT * FROM user_policy_mapping WHERE user_policy_mapping.policy_id = ? ",stringify(ctx.policyid));

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
            var users = group.getUsersOfGroup({'groupid':groupId});
            for(var i=0;i<users.length;i++){
                userg.sendMsgToUser({'userid': users[i].username,'operation':'POLICY','data':parse(policyData)});
            }
        },
        monitoring:function(ctx){
            setInterval(
           	 function(ctx){
	                device.monitor(ctx);
	            }
            ,100000);
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