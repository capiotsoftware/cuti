var log4js = require("log4js");
log4js.levels.forName("OFF",Number.MAX_VALUE-1);
log4js.levels.forName("AUDIT",Number.MAX_VALUE);
module.exports.getLogger = log4js;
