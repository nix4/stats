function getUTCTimestamp(dt) {
    var d = dt || new Date();
    return d.getTime() - (d.getTimezoneOffset() * 60 * 1000);
}

exports.getUTCTimestamp = getUTCTimestamp;
