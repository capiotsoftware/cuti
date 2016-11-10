var http = require("http");
var puttu = require("puttu-redis");
function getOptions(url,method,path,magicKey){
    var options = {};
    path = url.split("/");
    options.hostname = url.split("//")[1].split(":")[0];
    options.port = url.split(":")[2].split("/")[0];
    options.path = "/"+path.splice(3,path.length-3).join("/");
    options.method = method;
    options.headers = {};
    options.headers["content-type"] = "application/json";
    options.headers["magicKey"] = magicKey?magicKey:null; 
    return options;   
}
function getUrlandMagicKey(masterName,retries){
    if(!retries) /* then */ retries = Date.now();
    return puttu.get(masterName)
    .then(url => {
        return puttu.getMagicKey(masterName)
        .then(magicKey => {
            var options = {};
            var path = url.split("/");
            options.hostname = url.split("//")[1].split(":")[0];
            options.port = url.split(":")[2].split("/")[0];
            options.path = "/"+path.splice(3,path.length-3).join("/");
            options.method = "GET";
            options.headers = {};
            options.headers["content-type"] = "application/json";
            options.headers["magicKey"] = magicKey?magicKey:null;
            return new Promise(resolve => resolve(options));
        },err => console.error("error from prehooks internal",err));
    },err => Date.now()-retries<500?getUrlandMagicKey(masterName,retries):new Promise((resolve,reject) => reject(new Error(masterName+" Service down"))));
}
function checkIfExists(masterName,id){
    return new Promise((resolve,reject) => {
        getUrlandMagicKey(masterName)
        .then(options => {
            options.path += "/"+id;
            http.request(options, response => response.statusCode===200?resolve():reject(new Error("Invalid "+masterName))).end();
        },err => reject(err));
    });
}
module.exports.getOptions = getOptions;
module.exports.getUrlandMagicKey = getUrlandMagicKey;
module.exports.checkIfExists = checkIfExists;