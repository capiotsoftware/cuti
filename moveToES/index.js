var crud = null;
var mastername = null;
var es_url = process.env.ES_URL?process.env.ES_URL:"http://localhost:9200";
var http = require("http");
var logger = null;
var init = function(_crud,_mastername,_logger){
    crud = _crud;
    mastername = _mastername;
    logger = _logger;
};
var moveToES = function(doc){
    if(doc.deleted){
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
    }
};
var moveAll = function(req,res){
    crud.model.find({deleted:true}).exec().
    then(docs => docs.forEach(el => moveToES(el)));
    res.status(200).json({message: "Pushing data to Elastic"});
};
module.exports.moveToES = moveToES;
module.exports.moveAll = moveAll;
module.exports.init = init;