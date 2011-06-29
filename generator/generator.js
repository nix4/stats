var udp = require('dgram');
var hosts = ["host1", "host2", "host3"];
var keys = ["a.b", "p.q.r", "x.y.z", "c.q.qm", "we.ee", "o.r.t.y", "q.w", "w.e", "e.r", "t.y"];
var tKeys = ["t.1", "t.2", "t.3"];
var fl = Math.floor, rnd = Math.random;

setInterval(function() {
    var sock = udp.createSocket("udp4");
    /*
    var buf = new Buffer(keys[fl(rnd() * 10)] + "|" + hosts[(fl(rnd() * 10) % 3)] + "|"+ fl(rnd() * 10) +'|c');
    sock.send(buf, 0, buf.length, 10000, "localhost");
    buf = new Buffer(tKeys[(fl(rnd() * 10) % 3)] + "|" + hosts[(fl(rnd() * 10) % 3)] + "|" + fl(rnd() * 1000) + "|t");
    sock.send(buf, 0, buf.length, 10000, "localhost");
    buf = new Buffer("key.constant|host1|200|c");
    sock.send(buf, 0, buf.length, 10000, "localhost");
    */

    var buf = new Buffer('a.b|' + hosts[(fl(rnd() * 10) % 3)] + "|" + fl(rnd() * 10) + "|c");
    sock.send(buf, 0, buf.length, 10000, "localhost");
    buf = new Buffer('p.q|' + hosts[(fl(rnd() * 10) % 3)] + "|" + fl(rnd() * 10) + "|c");
    sock.send(buf, 0, buf.length, 10000, "localhost");
    buf = new Buffer("t.1|" + hosts[(fl(rnd() * 10) % 3)] + "|" + fl(rnd() * 1000) + "|t");
    sock.send(buf, 0, buf.length, 10000, "localhost");
    buf = new Buffer("t.2|" + hosts[(fl(rnd() * 10) % 3)] + "|" + fl(rnd() * 1000) + "|t");
    sock.send(buf, 0, buf.length, 10000, "localhost");
    sock.close();
}, 100)
