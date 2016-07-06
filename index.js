var StateEngine = require("./StateEngine");
var IDGenerator = require("./IDGenerator");
var rand = function (_i) {
    var i = Math.pow(10, _i - 1);
    var j = Math.pow(10, _i) - 1;
    return ((Math.floor(Math.random() * (j - i + 1)) + i));
};
var date = function (_dM) {
    var d = new Date();
    return new Date(d.setMonth(d.getMonth() - _dM));
};
module.exports = {
    StateEngine: StateEngine,
    rand:   rand,
    date: date,
    getUniqueID : IDGenerator
};