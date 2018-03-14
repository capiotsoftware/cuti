const request = require("request");

function validateRequest(_req, permissions) {
    try {
        let user = _req.user,
            method = _req.method,
            url = _req.path;
        if (!user) return false;
        var valid = false;
        Object.keys(permissions).forEach(key => {
            if (user.entitlements[key]) {
                permissions[key].forEach(el => {
                    if (el.method === method && url.indexOf(el.url) >= 0) valid = true;
                });
            }
        })
        return valid;
    } catch (e) {
        console.error(e);
        return false;
    }
}

function isUrlPermitted(permittedUrls, originalUrl) {
    let permitted = false;
    if (!permittedUrls) return false;
    permittedUrls.forEach(url => {
        if (originalUrl.startsWith(url)) {
            permitted = true;
            return;
        }
    });
    return permitted;
}

function validateJWT(url, req) {
    var options = {
        url: url,
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "TxnId": req.get('txnId'),
            "Authorization": req.get("Authorization")
        },
        json: true
    };
    return new Promise((resolve, reject) => {
        request.get(options, function (err, res, body) {
            if (err) {
                logger.error("Error requesting user Managment");
                reject(err);
            } else if (!res) {
                reject(new Error("User management service Down"));
            } else {
                if (res.statusCode == 200) resolve(body);
                else {
                    reject(new Error(JSON.stringify(body)));
                }
            }
        });
    });
}

var getAuthorizationMiddleware = (validationAPI, permittedUrls) => {
    return (_req, _res, next) => {
        if (_req.method == "OPTIONS") next();
        else if (isUrlPermitted(permittedUrls, _req.originalUrl)) next();
        else if (_req.get("authorization")) {
            let token = _req.get("authorization").split(" ")[1];
            if (token) {
                validateJWT(validationAPI, _req)
                    .then(body => {
                        _req.user = body;
                        next();
                    })
                    .catch(err => {
                        _res.status(401).json({
                            message: "Unauthorized"
                        });
                    });
            }
        } else {
            _res.status(401).json({
                message: "Unauthorized"
            });
        }
    };
}

module.exports.getAuthMiddleware = getAuthorizationMiddleware;