var mongoose = require("mongoose");
var url = process.env.MONGO_URL ? process.env.MONGO_URL : "mongodb://localhost/storeKing";
mongoose.connect(url);

var date = process.env.EXPIRE?process.env.EXPIRE:new Date("3000-12-31");
var counterSchema = new mongoose.Schema({
    _id: {type:   String},
    next: {type: Number},
    expiresAt: { type: Date,default:date }     
});
counterSchema.index({ expiresAt: 1 }, { expireAfterSeconds : 0 });
var counterModel = mongoose.model("counter",counterSchema);    
var setDefaults = function(sequenceName,defaultValue){
    if(!sequenceName){
        return;
    }
    if(!defaultValue){
        defaultValue =0;
    }
    var options = {};
    options.new = true;
    options.upsert = true;
    options.setDefaultsOnInsert = true;
    counterModel.create({_id:sequenceName,next:defaultValue});
};
var getCount = function(sequenceName,expire,callback){
    var options = {};
    if(!expire){
        expire = date;
    }
    options.new = true;
    options.upsert = true;
    options.setDefaultsOnInsert = true;
    counterModel.findByIdAndUpdate(sequenceName,{ $inc: { next: 1 }, $set:{expiresAt:expire} }, options,callback);
};
module.exports.getCount = getCount;
module.exports.setDefaults = setDefaults;