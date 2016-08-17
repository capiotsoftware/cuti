var http = require("http");
var _ = require("lodash");
var masterName = null;
var crudder = null;
var init = (_m,_crudder) => {
    masterName = _m;
    crudder = _crudder;        
};
var validationGet = (req,res,next) => {
    var select = req.query.select;
    var options = {};
    options.hostname = req.headers.validationurl.split("//")[1].split(":")[0];
    options.port = req.headers.validationurl.split(":")[2].split("/")[0];
    options.path = "/permissionsGet";
    options.method = "POST";
    options.headers = {};
    options.headers = req.headers;
    options.headers["mastername"] = masterName;
    http.request(options,function(res){
        res.on("data",(data) => {
            data = JSON.parse(data);
            var newSelect = select?_.intersection(select.split(","),data):data;
            req.query.select = newSelect.length>0?newSelect.join():"_id";
            next();    
        });
    }).end(); 
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
    options.hostname = req.headers.validationurl.split("//")[1].split(":")[0];
    options.port = req.headers.validationurl.split(":")[2].split("/")[0];
    options.path = "/permissionsPost";
    options.method = "POST";
    options.headers = req.headers;
    options.headers["content-length"] = 0;
    options.headers["mastername"] = masterName;
    http.request(options,function(result){
        result.on("data",(permissionData) => {
            permissionData = permissionData.toString("utf8");
            permissionData = JSON.parse(permissionData);
            var flag = permissionData.reduce((prev,curr) =>{
                var key = Object.keys(curr)[0];
                var value = getValue(req.body,key);
                if(curr[key] == false){
                    return (!value)?prev:false;
                }
                else if(curr[key]!=true){
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
    }).end();   
};
var getDiff = function(el,oldObj,newObj){
    var diffObj = {};
    if(oldObj && newObj && oldObj[el] && newObj[el]){
        if(oldObj[el].constructor.name == "Object"){
            diffObj[el] = diff(oldObj[el],newObj[el]);    
        }
        else if(oldObj[el] != newObj[el]){
            diffObj[el] = {};
            diffObj[el]["__diff"] = "!"
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
            diffObj[el]["__diff"] = "-"
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
    var options = {};
    options.hostname = req.headers.validationurl.split("//")[1].split(":")[0];
    options.port = req.headers.validationurl.split(":")[2].split("/")[0];
    options.path = "/permissionsPost";
    options.method = "POST";
    options.headers = {};
    options.headers = req.headers;
    options.headers["content-length"] = 0;
    options.headers["mastername"] = masterName;
    //console.log("inside method", options);
    http.request(options,function(response){
        response.on("data",function(permissionData){
            crudder.model.find({_id:req.body._id},function(err,doc){
                if(doc.length!=1){
                    return next(new Error("Invalid object"));
                }
                var result = diff(doc[0].toObject(),req.body);            
                permissionData = permissionData.toString("utf8");
                permissionData = JSON.parse(permissionData);
                var flag = permissionData.reduce((prev,curr) =>{
                    var segment = {};
                    var key = Object.keys(curr)[0];
                    segment[key] = getValue(result,key);
                    if(!segment[key]){
                        return prev;
                    }
                    else if(curr[key] == false){
                        return (!segment[key].r)?prev:false;
                    }
                    else if(curr[key]!=true){
                        if(curr[key].type == "%"){
                            var val = segment[key].l;
                            var upperLim = (val+(val*curr[key].max)/100);
                            var lowerLim = (val+(val*curr[key].min)/100); 
                            return (segment[key].r>=lowerLim && segment[key].r<=upperLim)?prev:false;
                        }
                        else{
                            return (curr[key].min<=segment[key].r && curr[key].max>=segment[key].r)?prev:false    
                        }
                    }
                    else{
                        return prev;
                    }
                },true); 
                flag?next():next(new Error("Write permission to the mentioned fields denied"));    
            });
        });
    }).end();        
};
module.exports.validationGet = validationGet;
module.exports.validationPost = validationPost;
module.exports.validationPut = validationPut;
module.exports.init = init;