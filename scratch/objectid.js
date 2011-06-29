var mongodb = require('mongodb'),
    utils = require('util'),
    myutils = require('../common/util.js');

//console.dir(mongodb.BSONPure)

console.log(new mongodb.BSONPure.ObjectID(myutils.getUTCTimestamp() + 'abcd'));

