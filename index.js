var StateEngine = require("./StateEngine");
var rand = require("./rand");
var validation = require("./Validation");
var date = require("./date");
var IDGenerator = require("./IDGenerator");
var rbac = require("./rbac");
var counter = require("./counter");
var logger = require("./logger");
var moveToES = require("./moveToES");
var request = require("./Request");
var authMiddleware = require("./AuthorizationMiddleware");
var logMiddleware = require("./logMiddleware");
var logToES = require("./logToES");

var masterName = null;

function init(name) {
    masterName = name;
    request.init(masterName);
}

module.exports = {
    init: init,
    StateEngine : StateEngine,
    rand :   rand,
    date : date,
    getUniqueID : IDGenerator,
    counter: counter,
    logger : logger,
    validation : validation,
    moveToES : moveToES,
    rbac:   rbac,
    request : request,
	authMiddleware : authMiddleware,
    logMiddleware: logMiddleware,
    logToES: logToES	
};