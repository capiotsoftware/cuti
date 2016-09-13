var http = require("http");
var puttu = require("puttu-redis");
function getOptions(url,method,path,magicKey){
    var options = {};
    options.hostname = url.split("//")[1].split(":")[0];
    options.port = url.split(":")[2].split("/")[0];
    options.path = path;
    options.method = method;
    options.headers = {};
    options.headers["content-type"] = "application/json";
    options.headers["magicKey"] = magicKey?magicKey:null; 
    return options;   
}
function getUrlandMagicKey(masterName){
    return puttu.get(masterName).then(url => {
        return puttu.getMagicKey(masterName).then(magicKey =>{
            return new Promise((res,rej)=>{
                res(getOptions(url,"GET","/"+masterName+"/v1",magicKey));
            });
        });
    });
}
function checkIfExists(masterName,id){
    return getUrlandMagicKey(masterName).then((options) => {
        options.path += "/"+id;
        return new Promise((resolve,reject) => 
        http.request(options,(res) => {
            res.statusCode === 200?resolve() : reject(new Error("Invalid "+masterName));}
            ).end());
        },
        () =>{
            new Promise((resolve,reject)=>reject(new Error(masterName+"Service Unavailable")));    
        }
    );
}
module.exports.getOptions = getOptions;
module.exports.getUrlandMagicKey = getUrlandMagicKey;
module.exports.checkIfExists = checkIfExists;