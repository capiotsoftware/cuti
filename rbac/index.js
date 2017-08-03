var http = require("http");
var puttu = require("puttu-redis");
var _ = require("lodash");
var mongoose = require("mongoose");
var request = require("../Request");
function validateGetRequest(collectionName, masterName){
    return function(req,res,next){
        if(req.user){
            next();
        }
        else if(req.headers["authorization"]){
            request.getUrlandMagicKey("user")
                .then(options => {
                    options.path += "/permissionsGet";
                    options.headers = {};
                    options.headers["content-length"] = 0;
                    options.headers["mastername"] = collectionName;
                    options.headers["authorization"] = req.headers["authorization"];
                    var httpRequest = http.request(options, response => {
                        var data = "";
                        if(response.statusCode == 200){
                            response.on("data", _data => data += _data.toString());
                            response.on("end", () => {
                                try {
                                    data = JSON.parse(data);
                                    req.user = data.user;
                                    var userGroups = data.user.groups;
                                    var allowedFields = [];
                                    if(req.query.select){
                                        req.query.select.split(",").forEach(el => {
                                            userGroups.every(_el => {
                                                if(data.permission[el] && data.permission[el]["permissions"][_el] && data.permission[el]["permissions"][_el]!="N"){
                                                    allowedFields.push(el);
                                                    return false;
                                                }
                                                return true;
                                            });
                                        });
                                    }
                                    else{
                                        Object.keys(data.permission).forEach(el => {
                                            userGroups.every(_el => {
                                                if(data.permission[el] && data.permission[el]["permissions"][_el] && data.permission[el]["permissions"][_el]!="N"){
                                                    allowedFields.push(el);
                                                    return false;
                                                }
                                                return true;
                                            });
                                        });
                                    }
                                    if(allowedFields.length==0)
                                        allowedFields.push("_id");
                                    req.query.select = allowedFields.join();
                                    next();
                                }
                                catch(err){
                                    res.status(500).json(err);
                                }
                            });
                        }
                        else{
                            res.status(401).json({message:"Authentication Failed"});
                        }
                    });
                    httpRequest.end();
                    httpRequest.on("error", err => res.status(500).json(err));
                }).catch(err => res.status(500).json(err));
        }
        else{
            req.user = {
                user:"Internal",
                franchise:"WMF0"
            };
            puttu.getMagicKey(masterName)
                .then(key=> key==req.headers.magickey?next():res.status(401).json({message:"Unauthorized"}));
        }
    };
}

function validatePostRequest(collectionName, masterName){
    return function(req,res,next){
        if(req.user){
            next();
        }
        else if(req.headers["authorization"]){
            request.getUrlandMagicKey("user")
                .then(options => {
                    options.path += "/permissionsGet";
                    options.headers = {};
                    options.headers["content-length"] = 0;
                    options.headers["mastername"] = collectionName;
                    options.headers["authorization"] = req.headers["authorization"];
                    var httpRequest = http.request(options, response => {
                        var data = "";
                        if(response.statusCode == 200){
                            response.on("data", _data => data += _data.toString());
                            response.on("end", () => {
                                try {
                                    data = JSON.parse(data);
                                    req.user = data.user;
                                    var userGroups = data.user.groups;
                                    var body = req.body;
                                    var flag = true;
                                    var field = null;
                                    Object.keys(body).every(el => {
                                        var tempFlag = false;
                                        userGroups.every(_el => {
                                            if(data.permission[el] && data.permission[el]["permissions"][_el] && data.permission[el]["permissions"][_el]!="N" && data.permission[el]["permissions"][_el]!="R"){
                                                if(data.permission[el]["permissions"][_el].indexOf("to")>-1){ 
                                                    var min = parseInt(data.permission[el]["permissions"][_el].split("to")[0]);
                                                    var max = parseInt(data.permission[el]["permissions"][_el].split("to")[1]);
                                                    if(min<=body[el] && max>=body[el]){
                                                        tempFlag = true;
                                                        return false;
                                                    }
                                                    else
                                                        return true;
                                                }
                                                else{
                                                    tempFlag = true;
                                                    return false;
                                                }
                                            }
                                            return true;
                                        });
                                        flag = flag && tempFlag;
                                        if(!flag){
                                            field = el;
                                        }
                                        return tempFlag;
                                    });
                                    if(flag){
                                        next();
                                    }
                                    else{
                                        res.status(400).json({message:"Write permissions on certain fields is not allowed:- "+field});
                                    }
                                }
                                catch(err){
                                    res.status(500).json(err);
                                }
                            });
                        }
                        else{
                            res.status(401).json({message:"Authentication Failed"});
                        }
                    });
                    httpRequest.end();
                    httpRequest.on("error", err => res.status(500).json(err));
                });     
        }
        else{
            req.user = {
                user:"Internal",
                franchise:"WMF0"
            };
            puttu.getMagicKey(masterName)
                .then(key=> key==req.headers.magickey?next():res.status(401).json({message:"Unauthorized"}));
        }
    };
}

function validatePutRequest(collectionName, masterName, modelName){
    return function(req, res, next){
        if(req.user){
            next();
        }
        else if(req.headers["authorization"]){
            request.getUrlandMagicKey("user")
                .then(options => {
                    options.path += "/permissionsGet";
                    options.headers = {};
                    options.headers["content-length"] = 0;
                    options.headers["mastername"] = collectionName;
                    options.headers["authorization"] = req.headers["authorization"];
                    var httpRequest = http.request(options, response => {
                        var data = "";
                        if(response.statusCode == 200){
                            response.on("data", _data => data += _data.toString());
                            response.on("end", () => {
                                try {
                                    data = JSON.parse(data);
                                    req.user = data.user;
                                    var userGroups = data.user.groups;
                                    var body = req.body;
                                    var flag = true;
                                    var field = null;
                                    mongoose.models[modelName].findOne({_id:body._id}).lean().exec()
                                        .then(doc =>{
                                            if(doc){
                                                Object.keys(body).every(el => {
                                                    var tempFlag = false;
                                                    userGroups.every(_el => {
                                                        if((doc[el] == body[el]) || (data.permission[el] && data.permission[el]["permissions"][_el] && data.permission[el]["permissions"][_el]!="N" && data.permission[el]["permissions"][_el]!="R")){
                                                            if((doc[el] != body[el]) && data.permission[el]["permissions"][_el].indexOf("to")>-1){ 
                                                                var min = parseInt(data.permission[el]["permissions"][_el].split("to")[0]);
                                                                var max = parseInt(data.permission[el]["permissions"][_el].split("to")[1]);
                                                                if(min<=body[el] && max>=body[el]){
                                                                    tempFlag = true;
                                                                    return false;
                                                                }
                                                                else
                                                                    return true;
                                                            }
                                                            else{
                                                                tempFlag = true;
                                                                return false;
                                                            }
                                                        }
                                                        return true;
                                                    });
                                                    flag = flag && tempFlag;
                                                    if(!flag){
                                                        field = el;
                                                    }
                                                    return tempFlag;
                                                });
                                                if(flag){
                                                    next();
                                                }
                                                else{
                                                    res.status(400).json({message:"Write permissions on certain fields is not allowed:- "+field});
                                                }
                                            }
                                            else{
                                                res.status(404).json({message:"Document not found"});
                                            }
                                        }).catch(() => res.status(500).json({message:"Not Found"}));
                                }
                                catch(err){
                                    res.status(500).json(err);
                                }
                            });
                        }
                        else{
                            res.status(401).json({message:"Authentication Failed"});
                        }
                    });
                    httpRequest.end();
                    httpRequest.on("error", err => res.status(500).json(err));
                });
        }
        else{
            req.user = {
                user:"Internal",
                franchise:"WMF0"
            };
            puttu.getMagicKey(masterName)
                .then(key=> key==req.headers.magickey?next():res.status(401).json({message:"Unauthorized"}));
        }
    };
}

module.exports.validatePutRequest = validatePutRequest;
module.exports.validatePostRequest = validatePostRequest;
module.exports.validateGetRequest = validateGetRequest;