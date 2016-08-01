/**
 * Created by cool.blue on 8/1/2016.
 */
const fs     = require('fs'),
      path   = require('path');

module.exports = readAll;

function readAllAdd(s) {

    var readBackStream;

    if(s.path) {
        // add a method onto the stream to read back the temp file once
        readBackStream = fs.createReadStream(s.path);
        s.readAll = readAll.bind(readBackStream);
    }
    else {
        // need to pipe to a file in the command line and check the result
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
        next.bind(stream)(body)

        stream.removeListener('readable', readChunk);
        stream.removeListener('close', onClose);
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

readAll.add = readAllAdd;