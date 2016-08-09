var fs = require("fs");

var statFile = file =>
    new Promise((res, rej) => fs.stat(file, (err, stats) => err ? rej(err) : res(stats)));

var readdirectory = path =>
    new Promise((res, rej) => fs.readdir(path, (err, files) => err ? rej(err) : res(files)));

var checkandReadDir = path =>
    statFile(path).then(res => res.isDirectory())
        .then(res => {
            if (res) /* then */ return readdirectory(path);
            else throw new Error("Path is not a directory " + path);
        });

var openFile = file =>
    new Promise((res, rej) => fs.open(file, "r", (err, fd) => err ? rej(err) : res(fd)));    

var readFile = file =>
    new Promise((res, rej) => fs.readFile(file, "utf8", (err, data) => err || !data ? rej(err) : res(data.toString("utf-8"))));

var writeFile = (file, doc) =>
    new Promise((res, rej) => fs.writeFile(file, doc, (err) => err ? rej(err) : res(true)));    
    
var applyDefToDoc = (doc, defList) => {
    defList.forEach((def) => Object.keys(def).forEach(el => {
        if (doc.definitions && typeof doc.definitions[el] !== "undefined") {
            doc.definitions[el] = def[el];
        }
    }));
    return doc;
};

var generateExtractor = function (filterEl) {
    return function (el) {
        var retStruct = {};
        Object.keys(el).forEach(key => retStruct[key] = el[key][filterEl]);
        return retStruct;
    }.bind(this);
};

var recursiveSweep = function (appDefinition, definitions, definitionKeys) {
    Object.keys(appDefinition).forEach(key => {
        var idx = definitionKeys.find(val => "$CommonObjects/" + val  === key);
        if (idx) {
            appDefinition[idx] = definitions[idx];
            delete appDefinition["$CommonObjects/" + idx];
        }
        else if (typeof appDefinition[key] === "object") {
            if(appDefinition[key])
                appDefinition[key] == recursiveSweep(appDefinition[key], definitions, definitionKeys);
        }
    });
    return appDefinition;
};
 
var sweepAndReplace = (appDefinition, definitions) =>
    recursiveSweep(appDefinition, definitions, Object.keys(definitions));

module.exports = {
    statFile: statFile,
    readdirectory: readdirectory,
    checkandReadDir: checkandReadDir,
    openFile: openFile,
    readFile: readFile,
    writeFile: writeFile,
    applyDefToDoc: applyDefToDoc,
    generateExtractor: generateExtractor,
    sweepAndReplace: sweepAndReplace
};