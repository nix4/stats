var CFE = require("../common/CursorTracker"),
    mongo = require("mongodb");

var cfe = new CursorTracker();

//set up
var m = new mongo.Db("test", new mongo.Server("localhost", mongo.Connection.DEFAULT_PORT, {}), {native_parser:true});
m.open(function(err, db) {
    cfe.expect(2, function(data) {
        console.log('iterated through ' + cfe.expectedEvents + ' entries');
        db.collection('cfe_test', function(err, coll) {
            coll.remove({}, function(err, data) {
                process.exit(0);
            });
        });
    });
    
    db.createCollection('cfe_test', function(err, coll) {
        for (var i = 0; i < 5; i++) {
            coll.insert({'n': i});
        }
        console.log('created collection');
       
        db.collection('cfe_test', function(err, coll) {
            coll.find({'n' : {$lt: 2 }}, function(err, cursor) {
                cursor.each(function(err, c) {
                    if (!c) cfe.emit('cursorFinished');
                });
            });
            coll.find({'n' : {$gt: 2 }}, function(err, cursor) {
                cursor.each(function(err, c) {
                    if (!c) cfe.emit('cursorFinished');
                });
            });
        });
    });

});
