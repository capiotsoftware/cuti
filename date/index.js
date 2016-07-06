var date = function (_dM) {
    var d = new Date();
    return new Date(d.setMonth(d.getMonth() - _dM));
};
module.exports = date;