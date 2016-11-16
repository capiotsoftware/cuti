var http = require("http");
var _ = require("lodash");
var masterName = null;
var crudder = null;
var puttu = null;
var fieldName = null;
var init = (_m,_crudder,_puttu,_fieldName) => {
    masterName = _m;
    crudder = _crudder;       
    puttu = _puttu; 
    fieldName = _fieldName;
};
var validationGet = (req,res,next) => {
    var select = req.query.select;
    var options = {};
    if(req.headers["validation-url"] && req.headers["authorization"]){
        options.hostname = req.headers["validation-url"].split("//")[1].split(":")[0];
        options.port = req.headers["validation-url"].split(":")[2].split("/")[0];
        options.path = "/user/v1/permissionsGet";
        options.method = "POST";
        options.headers = {};
        options.headers = {};
        options.headers["authorization"] = req.headers["authorization"];
        options.headers["mastername"] = masterName;
        http.request(options,function(_res){
            if(_res.statusCode!=401){
                _res.on("data",(data) => {
                    data = JSON.parse(data);
                    req.user = data.user;
                    var enumPerms = data.enumPerms;
                    data = data.permission;
                    if(enumPerms){
                        req.query.filter = {};
                        req.query.filter[fieldName] = {"$in":enumPerms[fieldName]};
                    }
                    var notAuthorized = select?_.difference(select.split(","),data):[];
                    res.setHeader("unAuthorized", notAuthorized.join(","));
                    var newSelect = select?_.intersection(select.split(","),data):data;
                    req.query.select = newSelect.length>0?newSelect.join():"_id";
                    next();    
                });
            }
            else{
                res.status(401).json({message:"Unauthorized access"});
                next(new Error("unauthorized"));
            }
        }).end();
    }
    else if(req.headers.magickey){
        puttu.getMagicKey(masterName).then(key=> key==req.headers.magickey?next():res.status(401).json("unauthorized"));
    }
    else{
        res.status(401).json({message:"Unauthorized access"});
        next(new Error("unauthorized"));
    } 
};
var onlyTrustedAccess = (req,res,next) => {
    if(req.headers.magickey){
        puttu.getMagicKey(masterName).then(key=> key==req.headers.magickey?next():res.status(401).json("unauthorized"));
    }
    else{
        res.status(400).json({message:"method can only be accessible by trusted services"});
    }
};
var stateTransition = (req,res,next) => {
    if(req.headers["validation-url"] && req.headers["authorization"]){
        options.hostname = req.headers["validation-url"].split("//")[1].split(":")[0];
        options.port = req.headers["validation-url"].split(":")[2].split("/")[0];
        options.path = "/user/v1/permissionsPost";
        options.method = "POST";
        options.headers = req.headers;
        options.headers["content-length"] = 0;
        options.headers["mastername"] = masterName;
        http.request(options,function(result){
            if(result.statusCode!=401){
                result.on("data",(permissionData) => {
                    permissionData = permissionData.toString("utf8");
                    permissionData = JSON.parse(permissionData);
                    req.user = permissionData.user;
                    permissionData = permissionData.permission;
                    var flag = permissionData.reduce((prev,curr) =>{
                        var key = Object.keys(curr)[0];
                        var value = getValue(req.body,key);
                        return key==fieldName?curr[key].indexOf(value)>-1?prev:false:prev;
                    },true); 
                    flag?next():next(new Error("Create permissions denied")); 
                });
            }
            else{
                res.status(401).json({message:"Unauthorized access"});
                next(new Error("unauthorized"));
            }
        }).end();
    }
    else{
        res.status(400).json({message:"Validation URL required"});
    }
};
var getListOfVarriables = (obj) =>{
    var list = [];
    Object.keys(obj).reduce((prev,curr) =>
        obj[curr].constructor.name == "Object"?
            getListOfVarriables(obj[curr]).map(el => curr+"."+el).forEach(el => list.push(el)):list.push(curr)     
    ,null);
    return list;
};
var validationPost = (req,res,next) =>{
    var options = {};
    if(req.headers["validation-url"] && req.headers["authorization"]){
        options.hostname = req.headers["validation-url"].split("//")[1].split(":")[0];
        options.port = req.headers["validation-url"].split(":")[2].split("/")[0];
        options.path = "/user/v1/permissionsPost";
        options.method = "POST";
        options.headers = req.headers;
        options.headers["content-length"] = 0;
        options.headers["mastername"] = masterName;
        http.request(options,function(result){
            if(result.statusCode != 401){
                result.on("data",(permissionData) => {
                    permissionData = permissionData.toString("utf8");
                    permissionData = JSON.parse(permissionData);
                    req.user = permissionData.user;
                    permissionData = permissionData.permission;
                    var flag = permissionData.reduce((prev,curr) =>{
                        var key = Object.keys(curr)[0];
                        var value = getValue(req.body,key);
                        if(curr[key] == false){
                            return (!value)?prev:false;
                        }
                        else if(!value){
                            return prev;
                        }
                        else if(curr[key].type=="L"){
                            return (curr[key].min<=value && curr[key].max>=value)?prev:false;    
                        }
                        else if(curr[key].type == "%"){
                            return prev;
                        }
                        else{
                            return prev;
                        }
                    },true); 
                    flag?next():next(new Error("Create permissions denied")); 
                });
            }
            else{
                res.status(401).json({message:"Unauthorized access"});
                next(new Error("unauthorized"));
            }
        }).end();
    }
    else if(req.headers.magickey){
        puttu.getMagicKey(masterName).then(key=> key==req.headers.magickey?next():res.status(401).json("unauthorized"));
    }
    else{
        res.status(500).json("Validation Url Required");
    }   
};
var getDiff = function(el,oldObj,newObj){
    var diffObj = {};
    if(oldObj && newObj && oldObj[el] && newObj[el]){
        if(oldObj[el].constructor.name == "Object"){
            diffObj[el] = diff(oldObj[el],newObj[el]);    
        }
        else if(oldObj[el] != newObj[el]){
            diffObj[el] = {};
            diffObj[el]["__diff"] = "!";
            diffObj[el]["l"] = oldObj[el];
            diffObj[el]["r"] = newObj[el];
        }
        else{
            diffObj[el] = -1;
        }    
    }
    else if(oldObj && oldObj[el]){
        if(oldObj[el].constructor.name == "Object"){
            diffObj[el] = diff(oldObj[el],newObj[el]);    
        }
        else{
            diffObj[el] = {};
            diffObj[el]["__diff"] = "-";
            diffObj[el]["l"] = oldObj[el];
        }
    }
    else if(newObj && newObj[el]){
        if(newObj[el].constructor.name == "Object"){
            diffObj[el] = diff(oldObj[el],newObj[el]);    
        }
        else{
            diffObj[el] = {};
            diffObj[el]["__diff"] = "+";
            diffObj[el]["r"] = newObj[el];
        }
    }    
    return diffObj;
};
var diff = function(oldObj,newObj){
    var diffObj = {};
    var oldObjKeys = oldObj?Object.keys(oldObj):[];
    var newObjKeys = newObj?Object.keys(newObj):[]; 
    var values = _.union(oldObjKeys,newObjKeys);
    values.forEach(el => {
        var res = getDiff(el,oldObj,newObj)[el];
        if(res!=-1)
            diffObj[el]=res;
    });    
    return diffObj;
};
var getValue = function(obj,key){
    var keys = key.split(".");
    var ans = keys.reduce((prev,curr) => prev?prev[curr]:prev,obj);
    return ans;    
};
var validationPut = (req,res,next) =>{
    var url = req.params["0"].split("/");
    req.body._id = url[url.length-1];
    if(req.headers["validation-url"] && req.headers["authorization"]){
        var options = {};
        options.hostname = req.headers["validation-url"].split("//")[1].split(":")[0];
        options.port = req.headers["validation-url"].split(":")[2].split("/")[0];
        options.path = "/user/v1/permissionsPost";
        options.method = "POST";
        options.headers = {};
        options.headers = req.headers;
        options.headers["content-length"] = 0;
        options.headers["mastername"] = masterName;
        http.request(options,function(response){
            if(response.statusCode!=401){
                response.on("data",function(permissionData){
                    crudder.model.find({_id:req.body._id},function(err,doc){
                        if(doc.length!=1){
                            return next(new Error("Invalid object"));
                        }
                        var result = diff(doc[0].toObject(),req.body);            
                        permissionData = permissionData.toString("utf8");
                        permissionData = JSON.parse(permissionData);
                        req.user = permissionData.user;
                        permissionData = permissionData.permission;
                        var flag = permissionData.reduce((prev,curr) =>{
                            var segment = {};
                            var key = Object.keys(curr)[0];
                            segment[key] = getValue(result,key);
                            if(!segment[key]){
                                return prev;
                            }
                            else if(!segment[key].r){
                                return prev;
                            }
                            else if(curr[key] == false){
                                return (!segment[key].r)?prev:false;
                            }
                            else if(curr[key]!=true){
                                if(!segment[key].r){
                                    return prev;
                                }
                                else if(curr[key].type == "%"){
                                    var val = segment[key].l;
                                    var upperLim = (val+(val*curr[key].max)/100);
                                    var lowerLim = (val+(val*curr[key].min)/100); 
                                    return (segment[key].r>=lowerLim && segment[key].r<=upperLim)?prev:false;
                                }
                                else{
                                    return (curr[key].min<=segment[key].r && curr[key].max>=segment[key].r)?prev:false;    
                                }
                            }
                            else{
                                return prev;
                            }
                        },true); 
                        flag?next():next(new Error("Write permission to the mentioned fields denied"));    
                    });
                });
            }
            else{
                res.status(401).json({message:"Unauthorized access"});
                next(new Error("unauthorized"));
            }
        }).end();
    }
    else if(req.headers.magickey){
        puttu.getMagicKey(masterName).then(key=> key==req.headers.magickey?next():res.status(401).json("unauthorized"));
    }
    else{
        res.status(500).json("Validation Url Required");    
    }        
};
var stateValidationPut = (req,res,next) =>{
    var url = req.params["0"].split("/");
    req.body._id = url[url.length-1];
    if(req.headers["validation-url"] && req.headers["authorization"]){
        var options = {};
        options.hostname = req.headers["validation-url"].split("//")[1].split(":")[0];
        options.port = req.headers["validation-url"].split(":")[2].split("/")[0];
        options.path = "/user/v1/permissionsPost";
        options.method = "POST";
        options.headers = {};
        options.headers = req.headers;
        options.headers["content-length"] = 0;
        options.headers["mastername"] = masterName;
        http.request(options,function(response){
            if(response.statusCode != 401){
                response.on("data",function(permissionData){
                    crudder.model.find({_id:req.body._id},function(err,doc){
                        if(doc.length!=1){
                            return next(new Error("Invalid object"));
                        }
                        var result = diff(doc[0].toObject(),req.body);            
                        permissionData = permissionData.toString("utf8");
                        permissionData = JSON.parse(permissionData);
                        req.user = permissionData.user;
                        permissionData = permissionData.permission;
                        var flag = permissionData.reduce((prev,curr) =>{
                            var segment = {};
                            var key = Object.keys(curr)[0];
                            segment[key] = getValue(result,key);
                            if(key == fieldName){
                                if(segment[key].r && segment[key].r==doc[key])
                                    curr[key].indexOf(doc[key])>-1?prev:false;
                                else if(!segment[key].r){
                                    curr[key].indexOf(segment[key].l)>-1?prev:false;
                                }
                                else{
                                    return false;
                                }    
                            }
                            if(!segment[key]){
                                return prev;
                            }
                            else if(!segment[key].r){
                                return prev;
                            }
                            else if(curr[key] == false){
                                return (!segment[key].r)?prev:false;
                            }
                            else if(curr[key]!=true){
                                if(!segment[key].r){
                                    return prev;
                                }
                                else if(curr[key].type == "%"){
                                    var val = segment[key].l;
                                    var upperLim = (val+(val*curr[key].max)/100);
                                    var lowerLim = (val+(val*curr[key].min)/100); 
                                    return (segment[key].r>=lowerLim && segment[key].r<=upperLim)?prev:false;
                                }
                                else{
                                    return (curr[key].min<=segment[key].r && curr[key].max>=segment[key].r)?prev:false;    
                                }
                            }
                            else{
                                return prev;
                            }
                        },true); 
                        flag?next():next(new Error("Write permission to the mentioned fields denied"));    
                    });
                });
            }
            else{
                res.status(401).json({message:"Unauthorized access"});
                next(new Error("unauthorized"));
            }
        }).end();
    }
    else if(req.headers.magickey){
        puttu.getMagicKey(masterName).then(key=> key==req.headers.magickey?next():res.status(401).json("unauthorized"));
    }
    else{
        res.status(500).json("Validation Url Required");    
    }        
};
module.exports.validationGet = validationGet;
module.exports.validationPost = validationPost;
module.exports.validationPut = validationPut;
module.exports.stateValidationPut = stateValidationPut;
module.exports.init = init;
module.exports.stateTransition = stateTransition;
module.exports.onlyTrustedAccess = onlyTrustedAccess;