var _ = require('underscore'),
    mongo = require('mongodb');
var events = require('events'),
    util = require('util');


var m = new mongo.Db("stats", new mongo.Server("localhost", mongo.Connection.DEFAULT_PORT, {}), {native_parser:true});
m.open(function(err, db) {
    var self = this;
    db.collection('temp', function(err, coll) {
        self.temp = coll;
        db.collection('raw', function(err, coll) {
            coll.find({'k':"a.b"}, function(err, cursor) {
                cursor.each(function(err, c) {
                    if (c) {
                        self.temp.save(c);
                        console.log(c.k);
                    }
                });
            });
            coll.find({'k':"p.q"}, function(err, cursor) {
                cursor.each(function(err, c) {
                    if (c) {
                        self.temp.save(c)
                        console.log(c.k);
                    }
                });
            });
        });

    });
});


