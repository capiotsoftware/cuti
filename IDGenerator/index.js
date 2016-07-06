var crypto = require("crypto");

var add0s = (length) => {
    var ret0s = "";
    for (var z = 0; z < length; z++) ret0s += "0";
    return ret0s;
};
var generateCandidateKey = length => {
    var byteLen = Math.ceil(length / 2);
    var bytes = crypto.randomBytes(byteLen);
    var numList = [];
    bytes.forEach(el => numList.push(el % 100));
    var final = numList.join("");
    if (final.length < length) {
        final = add0s(length - final.length) + final;
    } else if (final.length > length) {
        final = final.substring(0, length);
    }
    return final;

};

var getUniqueID = (model, length) => {
    var candidate = generateCandidateKey(length);
    return model.findOne({ _id: candidate }).exec().then(_ => _ ? getUniqueID(model, length) : candidate);
};

module.exports = getUniqueID;