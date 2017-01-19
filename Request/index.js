var http = require("http");
var puttu = require("puttu-redis");
var masterName = null;
function init(_masterName) {
    masterName = _masterName;
}
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
            options.headers["masterName"] = masterName;
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
function getElement(masterName, id, select){
    select = select?"?select="+select:"";
    return getUrlandMagicKey(masterName)
    .then(options => {
        options.path += "/"+id+select;
        return new Promise((resolve,reject) => {
            http.request(options,response=>{
                if(response.statusCode!=200){
                    reject(new Error(masterName+" return with statusCode "+response.statusCode));
                }
                else{
                    var data = "";
                    response.on("data", _data => data += _data.toString());
                    response.on("end",()=> resolve(JSON.parse(data)));
                }
            }).end();
        });
    });
}
function getServiceEntitlements(service, franchise){
    return new Promise((resolve) => {
        getUrlandMagicKey("franchise")
        .then(options => {
            options.path += "/"+franchise;
            options.method = "GET";
            http.request(options,response => {
                var data = "";
                response.on("data",_data => data+= _data.toString());
                response.on("end",()=>{
                    var franchise = JSON.parse(data);
                    resolve(franchise.services[service]);
                });
            }).end();
        });
    });
}
module.exports.getServiceEntitlements = getServiceEntitlements;
module.exports.getElement = getElement;
module.exports.getOptions = getOptions;
module.exports.getUrlandMagicKey = getUrlandMagicKey;
module.exports.checkIfExists = checkIfExists;
module.exports.init = init;