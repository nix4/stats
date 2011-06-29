var mongodb = require('mongodb');

function getUTCTimestamp(dt) {
    var d = dt || new Date();
    return d.getTime() - (d.getTimezoneOffset() * 60 * 1000);
}

var mapOneMinute = function() {
    emit(this.ts - (this.ts % (60 * 1000)), {"count": 1, "val": this.v, "min": this.v, "max": this.v, "ts": this.ts, "k": this.k});
};

var mapOneHour = function() {
    emit(this.ts - (this.ts % (60 * 60 * 1000)), {"count": 1, "val": this.v, "min": this.v, "max": this.v, "ts": this.ts, "k": this.k});
};

var now = getUTCTimestamp();
//var query = {t: "c", "d": 0, "h":"host1", "k":"a.b", "ts": {$lt: now}};
var query = {t: "c", "k": "a.b"};

var reduce = function(key, arr) {
    var result = {"count": 0, "val": 0, "min": 100000000, "max": 0, "ts": key, "k":""}
    arr.forEach(function(item) {
        result.count += item.count;
        result.val += item.val;
        result.min = Math.min(result.min, item.min);
        result.max = Math.max(result.max, item.max);
        result.ts = item.ts;
        result.k = item.k;
    });
    return result;
};

var finalize = function(key, item) {
    return {"min": item.min, "max": item.max, "count": item.count, "val": Math.round(item.val / item.count), "k": item.k} ;
}

var m = new mongodb.Db("stats", new mongodb.Server("localhost", mongodb.Connection.DEFAULT_PORT), {native_parser:true});
m.open(function(err, db) {
    db.collection('raw', function(err, coll) {
        coll.mapReduce(mapOneHour, reduce, {"query": {"t":"c", "k":"a.b"}, "finalize": finalize, "out": "mr_min_a_b"}, function(err, mrCollection) {
            mrCollection.find({}, function(err, cursor) {
                cursor.each(function(err, item) {
                    if (item) console.log(item);
                    else db.close();
                });
            });
        });
    });
});

