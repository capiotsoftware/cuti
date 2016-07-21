var yaml = require("js-yaml");
var fsUtils = require("./utils");

function CommonObjects() {
    this.definitions = [];
    //this.loadDefinitions();
    fsUtils.checkandReadDir(__dirname + "/definitions")
        .then(files => {
            if (files) {
                return Promise.all(files.map(el => __dirname + "/definitions/" + el).map(fsUtils.readFile))
                    .then(content => content.map(yaml.load));
            } else throw new Error("Unknown Error in initialize parse data");
        }).then(el => { this.definitions = el; return true; });
}

CommonObjects.prototype = {
    applyDefinitions : function (yamlFile) {
        return fsUtils.statFile(yamlFile).then(stat => {
            if (stat && stat.isFile()) /* then */ return true;
            else throw new Error("Could not stat the file / Or the provided path is not a file");
        }).then(() => fsUtils.readFile(yamlFile))
            .then(yaml.load)
            .then(doc => fsUtils.applyDefToDoc(doc, this.definitions))
            .then(yaml.dump)
            .then(doc => fsUtils.writeFile(yamlFile, doc));
    }
};


module.exports = CommonObjects;