var mongoose = require("mongoose");
var url = process.env.MONGO_URL ? process.env.MONGO_URL : "mongodb://localhost/storeKing";
//mongoose.connect(url);

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
function getIdGenerator(prefix,counterName){
    return function(next){
        var self = this;
        if(!self._id){
            getCount(counterName,null,function(err,doc){
                self._id = prefix+doc.next;
                next();
            });
        }
        else{
            next();
        }
    };
}
function transactionIdGenerator(){
    return function(next){
        var self = this;
        var date = new Date();
        date.setDate(date.getDate()+1);
        if(!self._id){
            getCount("universalTransactionId"+date.getDate(),date,function(err,doc){
                var count = 1000000;
                count += doc.next;
                date.setDate(date.getDate()-1);
                self._id = count.toString() + date.getTime();
                next();
            });
        }
        else{
            next();
        }
    };
}
function transactionIdGeneratorParallel(){
    return function(next,done){
        var self = this;
        var date = new Date();
        date.setDate(date.getDate()+1);
        if(!self._id){
            getCount("universalTransactionId"+date.getDate(),date,function(err,doc){
                var count = 1000000;
                count += doc.next;
                date.setDate(date.getDate()-1);
                self._id = count.toString() + date.getTime();
                done();
            });
        }
        else{
            done();
        }
        next();
    };
}
module.exports.transactionIdGeneratorParallel = transactionIdGeneratorParallel;
module.exports.transactionIdGenerator = transactionIdGenerator;
module.exports.getIdGenerator = getIdGenerator;
module.exports.getCount = getCount;
module.exports.setDefaults = setDefaults;