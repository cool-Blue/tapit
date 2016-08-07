/**
 * Created by cool.blue on 8/1/2016.
 */
const fs     = require('fs'),
      path   = require('path');

module.exports = readAll;

function readBack(s) {

    var readBackStream;

    if(s.path) {
        // add a method onto the stream to read back the temp file once
        s.readAll = function(next){
            readAll.bind(fs.createReadStream(this.path))(next);
        };
    }
    else {
        // need to pipe stdout to a file in the command line and check the result
    }

    return s

}

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

readAll.readBack = readBack;