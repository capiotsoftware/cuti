var StateEngine = require("./StateEngine");
var rand = require("./rand");
var validation = require("./Validation");
var date = require("./date");
var IDGenerator = require("./IDGenerator");
var rbac = require("./rbac");
var counter = require("./counter");
var logger = require("./logger");
var CommonObjects = require("./CommonObjects");
var moveToES = require("./moveToES");
var request = require("./Request");

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
    CommonObjects:CommonObjects,
    logger : logger,
    validation : validation,
    moveToES : moveToES,
    rbac:   rbac,
    request : request 
};