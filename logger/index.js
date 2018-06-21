var log4js = require("log4js");
log4js.configure({
    levels: {
      AUDIT: { value: Number.MAX_VALUE-1, colour: 'yellow' }
    },
    appenders: { out: { type: 'stdout' } },
    categories: { default: { appenders: ['out'], level: 'AUDIT' } }
  });
log4js.level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL: 'audit';
module.exports.getLogger = log4js;
