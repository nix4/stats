var udp = require('dgram'),
    mongo = require('mongodb'),
    myutil = require('../common/util.js');

var StatsServer = function() {
    this.mongo = new mongo.Db('stats', new mongo.Server("localhost", mongo.Connection.DEFAULT_PORT, {}), {native_parser:true});
};

StatsServer.prototype = {
    init: function() {
        var self = this;
        this.writeInterval = 10 * 1000; //10 seconds
        //this.writeInterval = 1 * 1000; //1 second
        this.counters = [];
        this.timers = [];
        this.mongo.open(function(err, db) {
            db.collection('raw', function(err, collection) {
                self.coll = collection;
            });
        });
    }, 

    start: function(cb) {
        if (this.server) return;
        
        this.server = udp.createSocket("udp4", 10000);
        var self = this; 
        this.server.on("message", function(msg, rinfo) {
            //console.log(msg.toString());
            self.record(msg);
        });
        
        var counters = this.counters;
        var timers = this.timers;
        var writer = setInterval(function() {
            var ts = myutil.getUTCTimestamp();
            var records = [];
            for (host in counters) {
                for (key in counters[host]) {
                    var val = counters[host][key];
                    records.push({
                        "m_m": 0,
                        "m_h": 0,
                        "k": key,
                        "h": host,
                        "v": val,
                        "t": "c",
                        "ts": ts,
                        "dt": new Date(ts)
                    });
                    counters[host][key] = 0;
                }
            }
            //console.log(timers);
            for (host in timers) {
                for (key in timers[host]) {
                    var vals = timers[host][key].sort(function(a, b) {
                        return a < b ? -1 : 1;
                    });
                    //console.log(vals);
                    var avg = 0, min = 0, max = 0, min10thp = 0, max90thp = 0;
                    if (vals.length != 0) {
                        var count = vals.length;
                        var maxThreshold = Math.round(count * 0.9);
                        var minThreshold = Math.round(count * 0.1);
                        min = vals[0];
                        max = vals[count - 1];
                        min10thp = vals[minThreshold];
                         max90thp = vals[maxThreshold - 1];
                        for (var i = minThreshold; i < maxThreshold; i++) {
                            avg += vals[i];
                        }
                        avg = Math.round(avg / (maxThreshold - minThreshold));
                    }
                    records.push({
                        "m_m": 0,
                        "m_h": 0,
                        "k": key,
                        "h": host,
                        "t": "t",
                        "m": min,
                        "mx": max,
                        "avg": avg,
                        "m10" : min10thp,
                        "m90": max90thp,
                        "ts": ts
                    });
                    timers[host][key] = [];
                }
            }
            self.coll.insertAll(records);
            records = [];
        }, this.writeInterval);

        this.server.bind(10000);
        cb();
    },

    /*
     * Record a stat in the database. Format:
     * key|host|value|type[|samplesize]
    */
    record: function(msg) {
        var parts = msg.toString().split("|");
        var key = parts[0],
            host = parts[1],
            val = parts[2],
            type = parts[3],
            s = parts[4] || 1;
        var counters = this.counters;
        var timers = this.timers;
        var self = this;
        if (type === "c") {
            if (!counters[host]) {
                counters[host] = [];
            }
            if (!counters[host][key]) {
                counters[host][key] = 0;
            }
            counters[host][key] += Number(val || 1) * (1 / s);
        } else if (type === "t") {
             if (!timers[host]) {
                timers[host] = [];
            }
            if (!timers[host][key]) {
                timers[host][key] = [];
            }
            timers[host][key].push(Number(val || 0));
        }
    }, 

    /* User primarily while debugging to generate a fixed amount of timed data */
    killAfterDelay: function(delayInSec) {
        setTimeout(function() {
            clearInterval(this.writeInterval);
            process.exit();
        }, delayInSec * 1000);
    }
}

var stats = new StatsServer();
stats.init();

stats.start(function() {
    console.log("Server started. Listening on port 10000");
    stats.killAfterDelay(120);
});
