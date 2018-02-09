const request = require('request');

function postRequest(url, data){
    var options = {
        url: url,
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        json: true,
        body: data
    };
    request.post(options);
}

function logToES(url){
    return function(req, res, next){
        res.on('finish', function(){
            let data = {};
            data.request = {};
            data.response = {};
            data.request.headers = req.headers;
            data.request.body = req.body;
            data.response.status = res.statusCode;
            postRequest(url, data);
        });
        next();
    };
}

module.exports = logToES;