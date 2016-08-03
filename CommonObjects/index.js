var yaml = require("js-yaml");
var fsUtils = require("./utils");
var fs = require("fs");

function CommonObjects() {
    this.swaggerDefinitions = [];
    this.mongooseDefinitions = {};
    //this.loadDefinitions();
    var files = fs.readdirSync(__dirname + "/definitions");
    if (files) {
        var defs = files.map(el => __dirname + "/definitions/" + el)
            .map(require);
        this.swaggerDefinitions = defs.map(fsUtils.generateExtractor("swagger"));
        defs.map(fsUtils.generateExtractor("mongoose")).forEach(data =>
                Object.keys(data).forEach(key => this.mongooseDefinitions[key] = data[key]));
    }
}

CommonObjects.prototype = {
    applySwaggerDefinitions : function (yamlFile) {
        return fsUtils.statFile(yamlFile).then(stat => {
            if (stat && stat.isFile()) /* then */ return true;
            else throw new Error("Could not stat the file / Or the provided path is not a file");
        }).then(() => fsUtils.readFile(yamlFile))
            .then(yaml.load)
            .then(doc => fsUtils.applyDefToDoc(doc, this.swaggerDefinitions))
            .then(yaml.dump)
            .then(doc => fsUtils.writeFile(yamlFile, doc));
    },
    applyMongooseDefinitions: function (appDefinition) {
        fsUtils.sweepAndReplace(appDefinition, this.mongooseDefinitions);
        return appDefinition;
    }
};


module.exports = CommonObjects.bind(CommonObjects);