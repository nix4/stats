var _ = require('underscore'),
    mongo = require('mongodb');
/*

var arr = [10,7,3,4,5,1,9];
var max = 0, min = 100, avg = 0, count = 0;
_(arr).forEach(function(i) {
    max = Math.max(max, i);
    min = Math.min(min, i);
    avg += i;
    count++;
});
console.log("max: " + max + " min: " + min + " avg: " + (avg / count));
var url = require('url');
console.log(url.parse('http://localhost:20000/report?ts=123&callback=cb&host=host1&host=host2', true));
console.log(new Date().getTimezoneOffset())

var arr = [1, 3453, 3453,12,43234,3,3,55,5677].sort(function(a, b) {return a < b ? -1 : 1});
console.log(arr);

console.log(_([1, 3453, 3453,12,43234,3,3,55,5677]).sort());
console.log(_([1, 2, 3]).reduce(function(a, b) {return a*b}, 1));

var d = new Date();
var utc = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds());
console.log("UTC date: " + new Date(utc));
console.log("Local ts: " + d.getTime())
console.log("UTC ts: " + utc);
console.log("TZ offset: " + d.getTimezoneOffset() * 60 * 1000);
var utcts = d.getTime() - (d.getTimezoneOffset() * 60* 1000);
console.log("ts normalized for UTC: " + utcts);
console.log("difference in ts normalized for UTC: " + (utcts - d.getTime()));

var dates = [];
for (var i = 0; i < 100;i++) {
    var d = new Date(1308253521303 + (i * 10 * 1000));
    //dates[d.getTime()] = d;
    dates.push(d);
}
var last = _(dates).last();
//var nearest = last - (last % (60 * 1000));
_(dates).forEach(function(item) {
    console.log(item +  " "  + item.getTime() + " " + ((item - (item % (60 * 1000)))));
});
*/

//setInterval(function() {
m.open(function(err, db) {
    db.collection('raw', function(err, coll) {
        coll.find({}, function(err, cursor) {
            cursor.each(function(err, item) {
                if (item) console.log(item);
                else cfe.emit('cursorFinished', item);//db.close();
            });
        });
    });
});
//}, 1000);
