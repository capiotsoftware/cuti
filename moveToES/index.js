var crud = null;
var mastername = null;
var request = require("../Request");
var es_url = process.env.ES_URL?process.env.ES_URL:"http://localhost:9200";
var http = require("http");
var logger = null;
var fields = null;
//Cross-Service fields can be a key-value pair or an array
//Deal with both the scenarios 
//field will be an Object which will be containing objects:-
// fieldName:{
//  master --> masterName
//  type --> Array or KV    
//}
var init = function(_crud,_mastername,_logger,_fields){
    crud = _crud;
    mastername = _mastername;
    logger = _logger;
    fields = _fields;
};
var moveToES = function(doc){
    if(doc.deleted){
        denormalizationMiddleWare(doc).then((_doc) => {
            doc = _doc;
            var obj = doc.toObject();
            delete obj._id;
            var options = {};
            options.hostname = es_url.split("//")[1].split(":")[0];
            options.port = es_url.split(":")[2].split("/")[0];
            options.path = mastername+"/deleted/"+doc._id;
            options.method = "POST";
            http.request(options,function(res){
                if(res.statusCode == 201 || res.statusCode == 200){
                    logger.audit(doc._id+" has been moved to Elastic");
                    doc.remove();        
                }
                else{
                    logger.audit(doc._id+" couldn't moved to Elastic");
                    res.on("data",data => logger.error(data.toString("utf8")));
                }    
            }).end(JSON.stringify(obj));
        });
    }
};
function denormalizationMiddleWare(doc){
    if(fields){
        var promises = Object.keys(fields).map(el => {
            if(doc[el] && fields[el].type == "Array"){
                return new Promise((res) => Promise.all(doc[el].map(_el => new Promise((_res,_rej) => {
                    request.getUrlandMagickey(fields[el].master)
                    .then(options => {
                        options.path += "/"+_el;
                        http.request(options,response => response.on("data",data => _res(JSON.parse(data.toString("utf8")))));
                    });
                }))).then(result => {doc[el] = result;res();}));
            }
            else if(doc[el] && fields[el].type != "Array"){
                return new Promise((_res) =>{
                    request.getUrlandMagickey(fields[el].master)
                    .then(options => {
                        options.path += "/"+doc[el];
                        http.request(options,response => response.on("data",data => {doc[el] = JSON.parse(data.toString("utf8"));_res();}));
                    });
                });
            }
            else{
                return new Promise(res=>res());
            }
        });
        return Promise.all(promises).then(() => doc);
    }
    else{
        return new Promise(res=>res(doc));
    }
}
var moveAll = function(req,res){
    crud.model.find({deleted:true}).exec().
    then(docs => docs.forEach(el => moveToES(el)));
    res.status(200).json({message: "Pushing data to Elastic"});
};
module.exports.moveToES = moveToES;
module.exports.moveAll = moveAll;
module.exports.init = init;