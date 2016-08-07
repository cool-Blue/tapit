/**
 * Created by cool.blue on 8/1/2016.
 */
const fs     = require('fs'),
      path   = require('path');

module.exports = readAll;

function readAll(next) {
    var stream = this;
    var body = "";

    if(!stream.path) {

    }

    function readChunk(fromreadit) {
        var chunk;
        chunk = stream.read();
        body += chunk;
    }

    function onClose(fromreadit) {
        stream.removeListener('readable', readChunk);
        stream.removeListener('close', onClose);

        next.bind(stream)(body)
    }

    stream
        .on('readable', ((onreadable) => {
            return readChunk
        })())
        .on('close', ((onclose) => {
            return onClose
        })());

    return stream;
}