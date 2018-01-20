var http = require("http");
var puttu = require("puttu-redis");
var hostMasterName = null;

var e = {};

e.init = (_masterName) => {
    hostMasterName = _masterName;
};

e.getOptions = (url,method,path,magicKey) => {
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
};

e.getUrlandMagicKey = (masterName,retries) => {
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
                    return getSourceHeader(hostMasterName)
                        .then(
                            _headerData => {
                                options.headers["sourceMagicKey"] = _headerData;
                                return new Promise(resolve => resolve(options));
                            }
                        );
                },err => console.error("error from prehooks internal",err));
        }, () => Date.now()-retries<500?e.getUrlandMagicKey(masterName,retries):new Promise((resolve,reject) => reject(new Error(masterName+" Service down"))));
};

e.validateSource = (masterName, key) => {
    return puttu.get(masterName)
        .then(() => {
            return puttu.getMagicKey(masterName)
                .then(
                    _magicKey => new Promise((resolve, reject) => {
                        _magicKey == key ? resolve() : reject();
                    })
                );
        });
};

function getSourceHeader(masterName,retries){
    if(!retries) /* then */ retries = Date.now();
    return puttu.get(masterName)
        .then(() => {
            return puttu.getMagicKey(masterName)
                .then(
                    _magicKey => new Promise(resolve => resolve(masterName + "#" + _magicKey)),
                    err => console.error("error from prehooks internal",err));
        },() => Date.now()-retries<500?getSourceHeader(masterName,retries):new Promise((resolve,reject) => reject(new Error(masterName+" Service down"))));
}

e.checkIfExists = (masterName,id) => {
    var masterOptions = null;
    return new Promise((resolve,reject) => {
        e.getUrlandMagicKey(masterName)
            .then(options => {
                options.path += "/"+id;
                masterOptions = options;
            },err => reject(err))
            .then( () => getSourceHeader(hostMasterName))
            .then( _hostHeader => {
                masterOptions.headers["sourceMagicKey"] = _hostHeader;
                http.request(masterOptions, response => response.statusCode===200?resolve():reject(new Error("Invalid "+masterName))).end();
            });
    });
};

e.getElement = (masterName, id, select) => {
    select = select?"?select="+select:"";
    var masterOptions = null;
    return e.getUrlandMagicKey(masterName)
        .then(options => {
            options.path += "/"+id+select;
            masterOptions = options;
        })
        .then( () => getSourceHeader(hostMasterName))
        .then( _hostHeader => {
            masterOptions.headers["sourceMagicKey"] = _hostHeader;
            return new Promise((resolve,reject) => {
                http.request(masterOptions,response=>{
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
};

module.exports = e;