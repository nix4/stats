var events = require('events'),
    util = require('util');

CursorTracker = exports.CursorTracker = function(numEvents) {
    events.EventEmitter.call(this);
    if (numEvents) this.expectedEvents = numEvents;
    this.currentlyReceived = 0;
    this.on('cursorFinished', function(data) {
        if (this.debug) console.log('received cursorFinished event');
        if (++this.currentlyReceived == this.expectedEvents) {
            this.onCursorFinished(data);
        }
    });
};

util.inherits(CursorTracker, events.EventEmitter);

CursorTracker.prototype.expect = function(n, callback) {
    if (typeof n === 'number') this.expectedEvents = n;
    else if (typeof n === 'function') callback = n;
    this.onCursorFinished = callback;
}
