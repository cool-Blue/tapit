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
    var old_readStream_read = stream._read;

    if (isWritable)
        stream.write = (function(write) {
            return function(string, encoding, fd) {
                var args = [].slice.call(arguments);
                args[0] = interceptor(string, tap);
                write.apply(stream, args);
            };
        }(stream.write));

    if (isReadable)
        stream._read = (function(read) {
            return function(string, encoding, fd) {
                var args = [].slice.call(arguments);
                args[0] = interceptor(string, tap);
                read.apply(stream, args);
            };
        }(stream._read));

    function interceptor(string, tap) {
        // only intercept the string
        var result = tap(string);
        if(typeof result == 'string') {
            string = result.replace(/\n$/, '') + (result && (/\n$/).test(string) ? '\n' : '');
        }
        return string;
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
