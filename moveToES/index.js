var crud = null;
var mastername = null;
var request = require("../Request");
var es_url = process.env.ES_URL?process.env.ES_URL:"localhost:9200";
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
            var obj = _doc;
            delete obj._id;
            var options = {};
            options.hostname = es_url.split(":")[0];
            options.port = es_url.split(":")[1];
            options.path = mastername+"/deleted/"+doc._id;
            options.method = "POST";
            try{
                http.request(options,function(res){
                    res.on("error",err => logger.error(err));
                    if(res.statusCode == 201 || res.statusCode == 200){
                        var logObject = {
                            "operation":"Move To Elastic",
                            "user":mastername,
                            "_id":doc._id,
                            "timestamp":new Date()
                        };
                        logger.audit(JSON.stringify(logObject));
                        doc.remove();        
                    }
                    else{
                        logger.info(doc._id+" couldn't moved to Elastic");
                        res.on("data",data => logger.error(data.toString("utf8")));

                    }    
                })
                .on("error", function(_d){
                    logger.error(_d);
                })
                .end(JSON.stringify(obj));
            }
            catch(err){
                logger.error(err);
            }
        },err => console.log(err));
    }
};
function denormalizationMiddleWare(doc){
    doc = doc.toObject();
    if(fields){
        var promises = Object.keys(fields).map(el => {
            if(doc[el] && fields[el].type == "Array"){
                return new Promise((res) => Promise.all(doc[el].map(_el => new Promise((_res,_rej) => {
                    request.getUrlandMagicKey(fields[el].master)
                    .then(options => {
                        options.path += "/"+_el;
                        http.request(options,response => response.on("data",data => {var obj = JSON.parse(data.toString("utf8")); obj.id = obj._id; delete obj._id;_res(obj);})).end();
                    });
                }))).then(result => {doc[el] = result;res();}));
            }
            if(doc[el] && fields[el].type == "ComplexArray"){
                return new Promise((res) => Promise.all(doc[el].map(_el => new Promise((_res,_rej) => {
                    request.getUrlandMagicKey(fields[el].master)
                    .then(options => {
                        options.path += "/"+_el[fields[el].key];
                        http.request(options,response => response.on("data",data => {var obj = JSON.parse(data.toString("utf8")); obj.id = obj._id; delete obj._id;_res(obj);})).end();
                    });
                }))).then(result => {doc[el] = result;res();}));
            }
            else if(doc[el] && fields[el].type == "ComplexKV"){
                return new Promise((_res) =>{
                    request.getUrlandMagicKey(fields[el].master)
                    .then(options => {
                        options.path += "/"+doc[el][fields[el].key];
                        http.request(options,response => response.on("data",data => {doc[el] = JSON.parse(data.toString("utf8")); doc[el].id = doc[el]._id; delete doc[el]._id; _res();})).end();
                    });
                });
            }
            else if(doc[el] && fields[el].type == "KV"){
                return new Promise((_res) =>{
                    request.getUrlandMagicKey(fields[el].master)
                    .then(options => {
                        options.path += "/"+doc[el];
                        http.request(options,response => response.on("data",data => {doc[el] = JSON.parse(data.toString("utf8")); doc[el].id = doc[el]._id; delete doc[el]._id; _res();})).end();
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