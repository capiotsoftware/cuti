"use strict";

var http = require("http");
var puttu = require("puttu-redis");
var _ = require("lodash");
var mongoose = require("mongoose");
var request = require("../Request");

function validateGetRequest(functionName, masterName) {
    return function (req, res, next) {
        if (req.user) {
            next();
        } else if (req.headers["authorization"]) {
            //has authorization header

            //Get magic key
            request.getUrlandMagicKey("usermgmt").then(options => {
                options.path += "/v1/user/permission?functionName=" + encodeURI(functionName);
                options.headers = {};
                options.headers["content-length"] = 0;
                //options.headers["mastername"] = functionName;
                options.headers["authorization"] = req.headers["authorization"];

                //Fetch permissions
                makeRequest(options, req, res).then((data) => {
                    var permissions = formatPermissions(data);
                    req.user = data.user;

                    //Check if the `select` contains any restricted fields 
                    var allowedFields = [], restrictedFields = [];
                    if (req.query.select) {
                        req.query.select.split(",").forEach(key => {
                            if (permissions.fields[key] && permissions.fields[key] !== 'None') {
                                allowedFields.push(key);
                            } else {
                                restrictedFields.push(key);
                            }
                        });
                    } else {
                        Object.keys(permissions.fields).forEach(key => {
                            if (permissions.fields[key] !== 'None') {
                                allowedFields.push(key);
                            }
                        });
                    }
                    
                    if (restrictedFields.length) {
                        // `select` contains restricted fields
                        res.status(403).json({message: `Not allowed to access ${restrictedFields.join(", ")}`});
                    } else {
                        if (!req.query.select || allowedFields.length == 0)
                            allowedFields.push("_id");
                        req.query.select = allowedFields.join();
                        next();
                    }
                }).catch((err) => {
                    res.status(401).json(err);
                });
            }).catch((err) => {
                res.status(500).json(err)
            });
        } else {
            req.user = {
                user: "Internal",
                franchise: "WMF0"
            };
            puttu.getMagicKey(masterName)
                .then(key => key == req.headers.magickey ? next() : res.status(401).json({message: "Unauthorized"}));
        }
    };
}

function validatePostRequest(functionName, masterName) {
    return function (req, res, next) {
        if (req.user) {
            next();
        } else if (req.headers["authorization"]) {
            //has authorization header

            //get magic key
            request.getUrlandMagicKey("usermgmt").then(options => {
                options.path += "/v1/user/permission?functionName=" + encodeURI(functionName);
                options.headers = {};
                options.headers["content-length"] = 0;
                //options.headers["mastername"] = collectionName;
                options.headers["authorization"] = req.headers["authorization"];


                //Fetch permissions
                makeRequest(options, req, res).then((data) => {
                    var permissions = formatPermissions(data);
                    req.user = data.user;
                    var body = req.body;
                    var restrictedFields = [];
                    var currentPath = [];

                    //Filter out restricted fields
                    var checkPermission = function (item) {
                        if (Array.isArray(item)) {
                            if (item.length) {
                                checkPermission(item[0]);
                            }
                        } else if (typeof item === 'object' && item !== null) {
                            for (var key in item) {
                                currentPath.push(key);
                                checkPermission(item[key]);
                                currentPath.pop();
                            }
                        } else {
                            var path = currentPath.join('.');
                            if (permissions.fields[path] !== undefined && permissions.fields[path] !== 'Write') {
                                restrictedFields.push(currentPath.join('.'));
                            }
                        }
                    }

                    //Start permission check
                    checkPermission(body);

                    // Procceed if no restricted fields
                    if (!restrictedFields.length) {
                        next();
                    } else {
                        // Throw 403 with list of restricted fields
                        res.status(403).json({message: "Write operations on certain fields are not allowed:- " + restrictedFields.join(', ')});
                    }
                }).catch((err) => {
                    res.status(401).json(err);
                });
            }).catch((err) => {
                res.status(500).json(err)
            });
        } else {
            req.user = {
                user: "Internal",
                franchise: "WMF0"
            };
            puttu.getMagicKey(masterName)
                .then(key => key == req.headers.magickey ? next() : res.status(401).json({message: "Unauthorized"}));
        }
    };
}

function validatePutRequest(functionName, masterName) {
    return function (req, res, next) {
        if (req.user) {
            next();
        } else if (req.headers["authorization"]) {
            request.getUrlandMagicKey("usermgmt").then(options => {
                options.path += "/v1/user/permission?functionName=" + encodeURI(functionName);
                options.headers = {};
                options.headers["content-length"] = 0;
                //options.headers["mastername"] = collectionName;
                options.headers["authorization"] = req.headers["authorization"];
                makeRequest(options, req, res).then((permData) => {
                    var permissions = formatPermissions(permData);
                    req.user = permData.user;
                    var body = req.body;
                    var restrictedFields = [];
                    var currentPath = [];

                    //Filter out restricted fields
                    var checkPermission = function (item) {
                        if (Array.isArray(item)) {
                            if (item.length) {
                                checkPermission(item[0]);
                            }
                        } else if (typeof item === 'object' && item !== null) {
                            for (var key in item) {
                                currentPath.push(key);
                                checkPermission(item[key]);
                                currentPath.pop();
                            }
                        } else {
                            var path = currentPath.join('.');
                            if (permissions.fields[path] !== undefined && permissions.fields[path] !== 'Write') {
                                restrictedFields.push(currentPath.join('.'));
                            }
                        }
                    }

                    //Start permission check
                    checkPermission(body);

                    if (!restrictedFields.length) {
                        next();
                    } else {
                        res.status(403).json({message: "Write operations on certain fields are not allowed: " + restrictedFields.join(', ')});
                    }
                }).catch((err) => {
                    res.status(401).json(err);
                });
            }).catch((err) => {
                res.status(500).json(err)
            });
        } else {
            req.user = {
                user: "Internal",
                franchise: "WMF0"
            };
            puttu.getMagicKey(masterName)
                .then(key => key == req.headers.magickey ? next() : res.status(401).json({message: "Unauthorized"}));
        }
    };
}

//Generic function to make http request
function makeRequest(_options, _req, _res) {
    return new Promise(function (resolve, reject) {
        var httpRequest = http.request(_options, response => {
            var data = "";
            if (response.statusCode == 200) {
                response.on("data", _data => data += _data.toString());
                response.on("end", () => {
                    try {
                        data = JSON.parse(data);
                        resolve(data);
                    } catch (err) {
                        reject({message: "Invalid Permissions"});
                    }
                });
            } else {
                reject({message: "Authentication Failed"});
            }
        });
        httpRequest.end();
        httpRequest.on("error", err => reject(_err));
    });
}

//Flatten the permissions object
function formatPermissions(_record) {
    var permissions = {fields: {}, actions: {}, dataAccess: {}};
    _record.screens.forEach((screen) => {
        screen.fieldGroups.forEach((group) => {
            group.fields.forEach((field) => {
                permissions.fields[field] = screen.screenPermission ? group.permission : 'None';
            });
        });
        screen.actions.forEach((action) => {
            permissions.actions[action.actionName] = screen.screenPermission ? action.permission : false;
        });
    });
    return permissions;
}

module.exports.validatePutRequest = validatePutRequest;
module.exports.validatePostRequest = validatePostRequest;
module.exports.validateGetRequest = validateGetRequest;