var yaml = require("js-yaml");
var fsUtils = require("./utils");

function CommonObjects() {
    this.swaggerDefinitions = [];
    this.mongooseDefinitions = {};
    //this.loadDefinitions();
    fsUtils.checkandReadDir(__dirname + "/definitions")
        .then(files => {
            if (files) {
                // return Promise.all(files.map(el => __dirname + "/definitions/" + el).map(fsUtils.readFile))
                //     .then(fsUtils.promiseLogger)
                //     .then(content => content.map(require))
                //     .catch(err => console.log(err));
                return files.map(el => __dirname + "/definitions/" + el)
                    .map(require).map(fsUtils.promiseLogger);
            } else throw new Error("Unknown Error in initialize parse data");
        }).then(el => {
            this.swaggerDefinitions = el.map(fsUtils.generateExtractor("swagger"));
            el.map(fsUtils.generateExtractor("mongoose")).forEach(data =>
                Object.keys(data).forEach(key => this.mongooseDefinitions[key] = data[key]));
            return true;
        }).catch(err => {
            throw err;
        });
}

CommonObjects.prototype = {
    applySwaggerDefinitions : function (yamlFile) {
        return fsUtils.statFile(yamlFile).then(stat => {
            if (stat && stat.isFile()) /* then */ return true;
            else throw new Error("Could not stat the file / Or the provided path is not a file");
        }).then(() => fsUtils.readFile(yamlFile))
            .then(yaml.load)
            .then(doc => fsUtils.applyDefToDoc(doc, this.definitions))
            .then(yaml.dump)
            .then(doc => fsUtils.writeFile(yamlFile, doc));
    },
    applyMongooseDefinitions: function (appDefinition) {
        fsUtils.sweepAndReplace(appDefinition, this.mongooseDefinitions);
        return appDefinition;
    }
};


module.exports = CommonObjects.bind(CommonObjects);