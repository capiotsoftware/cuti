var http = require("http");
var request = require("../Request");
function validateGetRequest(collectionName){
    return function(req,res,next){
        request.getUrlandMagicKey("user")
        .then(options => {
            options.path += "/permissionsGet";
            options.headers = req.headers;
            options.headers["content-length"] = 0;
            options.headers["mastername"] = collectionName;
            var httpRequest = http.request(options, response => {
                var data = "";
                if(response.statusCode == 200){
                    response.on("data", _data => data += _data.toString());
                    response.on("end", () => {
                        try {
                            data = JSON.parse(data);
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
                                console.log(userGroups);
                                Object.keys(data.permission).forEach(el => {
                                    userGroups.every(_el => {
                                        console.log(_el,data.permission[el]);
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
}

module.exports.validateGetRequest = validateGetRequest;