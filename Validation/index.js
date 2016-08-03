var http = require("http");
var _ = require("lodash");
var masterName = null;
var init = (_m) => {
    masterName = _m;        
};
var validationGet = (req,res,next) => {
    var select = req.query.select;
    var options = {};
    options.hostname = req.headers.validationurl.split("//")[1].split(":")[0];
    options.port = req.headers.validationurl.split(":")[2].split("/")[0];
    options.path = "/"+req.headers.validationurl.split(":")[2].split("/")[1];
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
module.exports.validationGet = validationGet;
module.exports.init = init;