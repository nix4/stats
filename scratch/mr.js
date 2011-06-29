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

db.runCommand({
    "mapreduce": "raw", 
    "query": query,
    "out": "mr_min",
    "map": mapOneMinute,
    "reduce": reduce,
    "finalize": finalize
});
db.runCommand({
    "mapreduce": "raw", 
    "query": {"t":"c", "k":"p.q"},
    "out": "mr_min_2",
    "map": mapOneMinute,
    "reduce": reduce,
    "finalize": finalize
});

db.runCommand({
    "mapreduce": "raw", 
    "query": query,
    "out": "mr_hr",
    "map": mapOneHour,
    "reduce": reduce,
    "finalize": finalize
});
/*db.raw.update(query, {$set: {"d":1}}, false, true);*/
