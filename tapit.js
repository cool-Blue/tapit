// Borrowed.
// https://gist.github.com/benbuckman/2758563
// Intercept writeStream to pass output thru callback.
//
//
// returns an unhook() function, call when done intercepting
var errors = {inputTypeError: new TypeError('tapit: input must be stream.Writable and/or stream.Readable')};
module.exports = function(stream, tap) {

    var isWritable = (stream.write && stream.writable),
        isReadable = (stream.read && stream.readable);

    if (!isWritable && !isReadable)
        throw errors.inputTypeError;

    var old_writeStream_write = stream.write;
    var old_readStream_read = stream.read;

    if (isWritable)
        stream.write = (function(write) {
            return function(string, encoding, fd) {
                var args = [].slice.call(arguments);
                args[0] = interceptor(string, tap);
                write.apply(stream, args);
            };
        }(stream.write));

    if (isReadable)
        stream.read = (function(read) {
            return function(string, encoding, fd) {
                var args = [].slice.call(arguments),
                    buff = read.apply(stream, args);
                stream.unshift(interceptor(buff, tap));
                return read.apply(stream, args);
            };
        }(stream.read));

    function interceptor(buffer, tap) {
        // only intercept the string
        var result = tap(buffer);
        if(typeof result == 'string') {
            buffer = result.replace(/\n$/, '') + (result && (/\n$/).test(buffer) ? '\n' : '');
        }
        return buffer;
    }

    // puts back to original
    return function unhook() {
        stream.write = old_writeStream_write;
        stream.read = old_readStream_read;
    };

};

if(process.env.NODE_ENV === 'test') {
    module.exports.errors = errors;
}
