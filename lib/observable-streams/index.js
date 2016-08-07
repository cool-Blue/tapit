/**
 * Created by cool.blue on 07-Aug-16.
 */

'use strict';

const fs = require('fs'),
      WriteStream = fs.WriteStream,
      ReadStream = fs.ReadStream,
      readAll   = require('../readstream'),
      util = require('util');

util.inherits(ObservableWriteStream, WriteStream);

exports.ObservableWriteStream = ObservableWriteStream;

function ObservableWriteStream(path, options){

    if (!(this instanceof ObservableWriteStream))
        return new ObservableWriteStream(path, options);

    WriteStream.call(this, path, options);

    this.name = "";
}

ObservableWriteStream.prototype.readAll = function (next) {

    if(this.path) {
        // add a method onto the stream to read back the temp file once
        readAll.bind(fs.createReadStream(this.path))(next);
    }
    else {
        // need to pipe stdout to a file in the command line and check the result
    }

    return this

};

util.inherits(ManagedReadStream, ReadStream);

exports.ManagedReadStream = ManagedReadStream;

function ManagedReadStream(path, options){

    if (!(this instanceof ManagedReadStream))
        return new ManagedReadStream(path, options);

    ReadStream.call(this, path, options);

    this.name = "";
}

ManagedReadStream.prototype.readAll = readAll;
