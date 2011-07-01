var http = require('http'),
    url  = require('url'),
    mongo = require('mongodb'),
    UTC_OFFSET = new Date().getTimezoneOffset() * 60 * 1000;

var StatsReader = function() {
    this.mongo = new mongo.Db('stats', new mongo.Server("localhost", mongo.Connection.DEFAULT_PORT, {}), {native_parser:true});
    this.propList = [];
    this.dbs = {};
}

StatsReader.prototype = {
    init: function() {
        if (this.server) return;
        var self = this;

        this.server = http.createServer(function(req, resp) {
            var q = url.parse(req.url, true),
                db = self.coll,
                path = q.pathname;
            //console.log(path);

            if (path === "/counters") {
                self.reportStats(req, resp);
            } else if (path === "/keys" || path === '/hosts') {
                self.reportKeys(req, resp);
            } else if (path === "/timers") {
                self.reportTimes(req, resp);
            } else if (path === "/meters") {
                self.reportMeters(req, resp);
            }
        });
        
        this.mongo.open(function(err, db) {
            db.collection('raw', function(err, coll) {
                self.coll = coll;    
                self.dbs.raw = coll;
            });
            db.collection('medium', function(err, coll) {
                self.medium = coll;    
                self.dbs.medium = coll;    
            });
            db.collection('longterm', function(err, coll) {
                self.longterm = coll;    
                self.dbs.longterm = coll;    
            });
        });
        
        this.server.listen(20000, "localhost");
    },
    
    reportKeys: function(req, resp) {
        var q = url.parse(req.url, true);
        var type = q.query.type;
        var keyName = q.pathname.substring(1, 2); //either k or h 
        this.coll.distinct(keyName, {"t": type || "c"}, function(err, data) {
            var str = JSON.stringify(data);
            if (q.query.callback) {
                str = q.query.callback + "(" + str + ")";
            }
            resp.writeHead(200, {'Content-Length' : str.length, 'Content-Type': 'application/json'});
            resp.write(str);
            resp.end();
        });
    },
    
    reportMeters: function(req, resp) {
    },

    reportStats: function(req, resp) {
        var q = url.parse(req.url, true),
            cb = q.query.callback,
            hosts = q.query.host ? (Array.isArray(q.query.host) ? q.query.host : [q.query.host]) : ['host1'],
            t = Number(q.query.ts || (new Date().getTime() - UTC_OFFSET)),
            dur = Number(q.query.dur || 300),
            limit = Number(q.query.limit || 0),
            key = q.query.key,
            src = q.query.source || "raw",
            db = this.dbs[src];
        db.find({'ts':{$gt: t - (dur * 1000)}, 'h': {$in: hosts}, 'k':key}, 
            {fields:['k', 'ts', 'v', 'h'], sort: [["ts",1]], "limit":limit}, 
            function(err, cursor) {
                var ret = {};
                for (var h = 0; h < hosts.length; h++) {
                    ret[hosts[h]] = [];
                }
                cursor.each(function(err, item) {
                    if (item) {
                        ret[item.h].push({"val": item.v || 0, "ts":item.ts, "key":item.k});
                    } else {
                        var str = cb + "(" + JSON.stringify(ret) + ")";
                        resp.writeHead(200, {'Content-Length' : str.length, 'Content-Type': 'application/json'});
                        resp.write(str);
                        resp.end();
                    }
               });
            }
        );
    },

    reportTimes: function(req, resp) {
        var q = url.parse(req.url, true),
            t = Number(q.query.ts || (new Date().getTime() - UTC_OFFSET)),
            cb = q.query.callback,
            hosts = q.query.host ? (Array.isArray(q.query.host) ? q.query.host : [q.query.host]) : ['host1'],
            dur = Number(q.query.dur || 300),
            limit = Number(q.query.limit || 0),
            key = q.query.key,
            src = q.query.source || "raw",
            db = this.dbs[src];
             
        db.find({
                'ts':{$gt: t - (dur * 1000)}, 
                'h': {$in: hosts}, 
                'k':key
            }, {
                fields:['k', 'ts', 'avg', 'm', 'h', "m10", "m90"], 
                sort: [["ts",1]], "limit":limit
            }, 
            function(err, cursor) {
                var ret = {};
                for (var h = 0; h < hosts.length; h++) {
                    ret[hosts[h]] = [];
                }
                cursor.each(function(err, item) {
                    if (item) {
                        ret[item.h].push({"avg": item.avg || 0, "min10thp": item.m10, "max": item.max, "max90thp": item.m90, "ts":item.ts, "key":item.k});
                    } else {
                        var str = cb + "(" + JSON.stringify(ret) + ")";
                        resp.writeHead(200, {'Content-Length' : str.length, 'Content-Type': 'application/json'});
                        resp.write(str);
                        resp.end();
                    }
                });
            }
        );
    }
}

var server = new StatsReader();
server.init();
