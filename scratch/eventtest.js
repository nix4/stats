var _ = require('underscore'),
    mongo = require('mongodb');
var events = require('events'),
    util = require('util');

CursorFinishedEvent = function(numEvents) {
    events.EventEmitter.call(this);
    if (numEvents) this.expectedEvents = numEvents;
};

util.inherits(CursorFinishedEvent, events.EventEmitter);

CursorFinishedEvent.prototype.expect = function(n) {
    console.log('Will listen for ' + n + ' events');
    this.expectedEvents = n;
}

var cfe = new CursorFinishedEvent();

var e = 0;
cfe.on('cursorFinished', function(data) {
    console.log('received cursorFinished event');
    if (++e == this.expectedEvents) {
        process.exit(0);
    }
});

var m = new mongo.Db("stats", new mongo.Server("localhost", mongo.Connection.DEFAULT_PORT, {}), {native_parser:true});
m.open(function(err, db) {
    db.collection('raw', function(err, coll) {
        coll.distinct('k', function(err, data) {
            cfe.expect(data.length);
            data.forEach(function(item) {
                coll.find({'k':item}, function(err, cursor) {
                    cursor.each(function(err, c) {
                        if (!c) cfe.emit('cursorFinished');
                    });
                });
            });
        });
    });
});

/*
var util = require('util'),
    events = require('events');

function MyStream() {
    //events.EventEmitter.call(this);
}

util.inherits(MyStream, events.EventEmitter);

MyStream.prototype.write = function(msg) {
    this.emit('data', msg);
}

var stream = new MyStream();

stream.on('data', function(data) {
    console.log('RECEIVED: ' + data);
});

stream.write('yaaayyy!');
*/
