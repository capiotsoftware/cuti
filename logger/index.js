var log4js = require("log4js");
log4js.configure({
    levels: {
      OFF: { value: Number.MAX_VALUE-1, colour: 'white' },
      AUDIT: { value: Number.MAX_VALUE, colour: 'yellow' }
    },
    appenders: { out: { type: 'stdout' } },
    categories: { default: { appenders: ['out'], level: 'AUDIT' } }
  });
module.exports.getLogger = log4js;
