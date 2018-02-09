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
    return request.post(options, function (err, res, body) {
        if (err) {
            logger.error(e.message);
        } else if (!res) {
            logger.error(url + " down");
        } else {
            if(res.statusCode === 200)
                logger.info("Pushed to ES");
        }
    });
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