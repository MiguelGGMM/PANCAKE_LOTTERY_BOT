const Config = require('./config');
const chalk = require('chalk');
var path = require("path");

process.env.NTBA_FIX_319 = 1; 

// Initialize dotenv for config variables
var dotenv = require('dotenv');
dotenv.config({
    path: path.resolve(__dirname + '/.env')
});

function log(...data) {
    for(var idx in data) {
        if(typeof data[idx] != 'function') {
            if(typeof data[idx] === 'object' || Array.isArray(data[idx])) {
                console.log(chalk.green(JSON.stringify(data[idx])));
            } else {
                console.log(chalk.green(data[idx]));
            }
        }
    }
}

function logWarning(...data) {
    for(var idx in data) {
        if(typeof data[idx] != 'function') {
            if(typeof data[idx] === 'object' || Array.isArray(data[idx])) {
                console.log(chalk.yellow(JSON.stringify(data[idx])));
            } else {
                console.log(chalk.yellow(data[idx]));
            }
        }
    }
}

function logError(...data) {
    for(var idx in data) {
        if(typeof data[idx] != 'function') {
            if(typeof data[idx] === 'object' || Array.isArray(data[idx])) {
                console.log(chalk.red(JSON.stringify(data[idx])));
            } else {
                console.log(chalk.red(data[idx]));
            }
        }
    }
}

String.prototype.break = function (numBreaks) {
    let str = this;
    for(var i=0; i < numBreaks; i++) {
        str += "\r\n";
    }

    return str;
};

String.prototype.format = function() {
    let formatted = this;
    for (let i = 0; i < arguments.length; i++) {
      let regexp = new RegExp('\\{'+i+'\\}', 'gi');
      formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

String.prototype.log = function() {
    log(this);
};

String.prototype.logWarning = function() {
    logWarning(this);
};

String.prototype.logError = function() {
    logError(this);
};

String.prototype.logDebug = function() { 
    let data = this;
    if(Config.DEBUG == 1) {
        data.log();
    }
};

String.prototype.logDebugWarning = function() {
    let data = this;
    if(Config.DEBUG == 1) {
        data.logWarning();
    }
};

String.prototype.logDebugError = function() {    
    let data = this; 
    if(Config.DEBUG == 1) {
        data.logError();
    }
};

Array.prototype.splitN = function(n) {
    let arr = this;
    return arr.map((e,i) => (i % n === 0) ? arr.slice(i, i + n) : null).filter((e) => e);
};

require("./pancakeLotteryBot.js");

`[PancakeLotteryBot] Just starting application in mode daemon. No port opened`.log();
`Environment: ${process.env.NODE_ENV}`.log();

/* module.exports = app; */