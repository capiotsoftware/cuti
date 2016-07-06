var rand = function (_i) {
    var i = Math.pow(10, _i - 1);
    var j = Math.pow(10, _i) - 1;
    return ((Math.floor(Math.random() * (j - i + 1)) + i));
};
module.exports = rand;