const jwt = require("jsonwebtoken");

function validateRequest(_req, permissions) {
    try {
        let user = _req.user,
            method = _req.method,
            url = _req.path;
        if (!user) return false;
        let userInUrl = url.split("/")[url.split("/").length - 1].trim();
        if (userInUrl === user.username) return true;
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
    permittedUrls.forEach(url => {
        if (originalUrl.indexOf(url) != -1){
            permitted = true;
        }
    })
    return permitted;
}

var getAuthorizationMiddleware = (jwtKey, permissions, permittedUrls) => {
    return (_req, _res, next) => {
        if (_req.method == "OPTIONS") next();
        else if (isUrlPermitted(permittedUrls, _req.originalUrl)) next();
        else if (_req.headers["authorization"]) {
            var token = _req.headers["authorization"].split(" ")[1];
            var user = null;
            if (token) {
                user = jwt.decode(token, jwtKey);
                if (user) {
                    _req.user = user;
                    validateRequest(_req, permissions) ? next() : _res.status(401).json({
                        message: "Unauthorized"
                    });
                } else _res.status(401).json({
                    message: "Unauthorized"
                });
            } else _res.status(401).json({
                message: "Unauthorized"
            });
        } else {
            _res.status(401).json({
                message: "Unauthorized"
            });
        }
    };
}

module.exports.getAuthMiddleware = getAuthorizationMiddleware;