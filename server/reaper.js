/* Map-reducer for aggregating timeseries data*/
var mongodb = require("mongodb"),
    myutil = require("../common/util.js"),
    CursorTracker = require("../common/CursorTracker").CursorTracker,
    _ = require('underscore'),
    utils = require('util');

var Reaper = function() {
    this.raw = "raw"; //raw data
    this.medium = "medium"; //1 minute data
    this.longterm = "longterm"; //1 hour data
    this.ct = new CursorTracker();
};

Reaper.prototype = {
    init: function() {
        var self = this;
        var m = new mongodb.Db("stats", new mongodb.Server("localhost", mongodb.Connection.DEFAULT_PORT), {native_parser:true});
        m.open(function(err, db) {
            self.mongo = db;
            db.collection("raw", function(err, collection) {
                self.raw = collection;
                db.collection("medium", function(err, collection) {
                    self.medium = collection;
                });
                db.collection("longterm", function(err, collection) {
                    self.longterm = collection;
                });
            });
        });
    },

    aggregate: function() {
        var self = this;
        this.raw.distinct("k", {"t": "c"}, function(err, data) {
            data.forEach(function(item) {
                self.mapReduceCounters(self.raw, item, "c");
            });
        });
        this.raw.distinct("k", {"t": "t"}, function(err, data) {
            data.forEach(function(item) {
                self.mapReduceTimers(self.raw, item, "t");
            });
        });


    },

    mapReduceCounters: function(coll, key, type) {
        var self = this;
        var mapOneMinute = function() {
            emit(this.ts - (this.ts % (60 * 1000)), {"k":this.k, "count": 1, "v": this.v, "min": this.v, "max": this.v, "ts": this.ts, "t": this.t});
        };
        
        var mapOneHour = function() {
            emit(this.ts - (this.ts % (60 * 60 * 1000)), {"k":this.k, "count": 1, "v": this.v, "min": this.v, "max": this.v, "ts": this.ts, "t": this.t});
        };
        
        
        var reduce = function(key, arr) {
            var result = {"count": 0, "v": 0, "min": 100000000, "max": 0, "ts": key, k:"", "t": this.t}
            arr.forEach(function(item) {
                result.count += item.count;
                result.v += item.v;
                result.min = Math.min(result.min, item.min);
                result.max = Math.max(result.max, item.max);
                result.ts = item.ts;
                result.k = item.k;
                result.t = item.t;
            });
            return result;
        };
        
        var finalize = function(key, item) {
            return {"k": item.k, "min": item.min, "max": item.max, "count": item.count, "v": Math.round(item.v / item.count), "ts": item.ts, "t":item.t} ;
        }

        var now = myutil.getUTCTimestamp();
        var nowMin = now - (now % (60 * 1000));
        var nowHr = now - (now % (60 * 60 * 1000));
        var query = {t: type, "k":key};
        var minOut = "mr_min_" + key.replace(/\./g, "_");
        var hrOut = "mr_hr_" + key.replace(/\./g, "_");
        
        coll.mapReduce(mapOneMinute, reduce, {"finalize": finalize, "query": _.extend(query, {"m_m":0, "ts": {$lt: nowMin}}), "out": minOut}, function(err, mrCollection) {
            if (err) console.log("error in mapreduce : " + err);
            mrCollection.find({}, function(err, cursor) {
                if (err) console.log('error in find ' + err);
                cursor.each(function(err, item) {
                    if (err) console.log("error iterating over cursor " + utils.inspect(err));
                    if (item) {
                        item._id = item.value.ts + '_' + item.value.k;
                        self.medium.insert(item)
                    } else {
                        self.raw.update(_.extend(query, {"m_m":0, "ts": {$lt: nowMin}}), {$set: {"m_m":1}}, {upsert:false, multi:true});
                        self.ct.emit('cursorFinished');
                    }
                });
            });
        });
        
        coll.mapReduce(mapOneHour, reduce, {"finalize": finalize, "query": _.extend(query, {"m_h":0, "ts": {$lt: nowHr}}), "out": hrOut}, function(err, mrCollection) {
            mrCollection.find({}, function(err, cursor) {
                cursor.each(function(err, item) {
                    if (item) {
                        item._id = item.value.ts + '_' + item.value.k;
                        self.longterm.insert(item);
                    } else {
                        self.raw.update(_.extend(query, {"m_h":0, "ts": {$lt: nowHr}}), {$set: {"m_h":1}}, {upsert:false, multi:true});
                        self.ct.emit('cursorFinished');
                    }
                });
            });
        });
    },

    mapReduceTimers: function(coll, key, type) {
        var self = this;
        var mapOneMinute = function() {
            emit(this.ts - (this.ts % (60 * 1000)), {"k":this.k, "count": 1, "avg": this.avg, "m10": this.m10, "m90": this.m90, "ts": this.ts});
        };
        
        var mapOneHour = function() {
            emit(this.ts - (this.ts % (60 * 60 * 1000)), {"k":this.k, "count": 1, "avg": this.avg, "m10": this.m10, "m90": this.m90, "ts": this.ts});
        };
        
        
        var reduce = function(key, arr) {
            var result = {"k": "", "count": 0, "avg": 0, "m10": 100000000, "m90": 0, "ts": key}
            arr.forEach(function(item) {
                result.count += item.count;
                result.avg += item.avg;
                result.m10 = Math.min(result.m10, item.m10);
                result.m90 = Math.max(result.m90, item.m90);
                result.ts = item.ts;
                result.k = item.k;
            });
            return result;
        };
        
        var finalize = function(key, item) {
            return {"k": item.k, "m10": item.m10, "m90": item.m90, "count": item.count, "avg": Math.round(item.v / item.count), "ts": item.ts} ;
        }

        var now = myutil.getUTCTimestamp();
        var nowMin = now - (now % (60 * 1000));
        var nowHr = now - (now % (60 * 60 * 1000));
        var query = {t: type, "k":key};
        var minOut = "mr_t_min_" + key.replace(/\./g, "_");
        var hrOut = "mr_t_hr_" + key.replace(/\./g, "_");
        
        coll.mapReduce(mapOneMinute, reduce, {"finalize": finalize, "query": _.extend(query, {"m_m":0, "ts": {$lt: nowMin}}), "out": minOut}, function(err, mrCollection) {
            if (err) console.log("error in mapreduce : " + err);
            mrCollection.find({}, function(err, cursor) {
                if (err) console.log('error in find ' + err);
                cursor.each(function(err, item) {
                    if (err) console.log("error iterating over cursor " + utils.inspect(err));
                    if (item) {
                        item._id = item.value.ts + '_' + item.value.k;
                        self.medium.insert(item)
                    } else {
                        self.raw.update(_.extend(query, {"m_m":0, "ts": {$lt: nowMin}}), {$set: {"m_m":1}}, {upsert:false, multi:true});
                        self.ct.emit('cursorFinished');
                    }
                });
            });
        });
        
        coll.mapReduce(mapOneHour, reduce, {"finalize": finalize, "query": _.extend(query, {"m_h":0, "ts": {$lt: nowHr}}), "out": hrOut}, function(err, mrCollection) {
            mrCollection.find({}, function(err, cursor) {
                cursor.each(function(err, item) {
                    if (item) {
                        item._id = item.value.ts + '_' + item.value.k;
                        self.longterm.insert(item);
                    } else {
                        self.raw.update(_.extend(query, {"m_h":0, "ts": {$lt: nowHr}}), {$set: {"m_h":1}}, {upsert:false, multi:true});
                        self.ct.emit('cursorFinished');
                    }
                });
            });
        });

    }

}

var reaper = new Reaper();
reaper.init();
setTimeout(function() {
    reaper.aggregate();
}, 1000);
