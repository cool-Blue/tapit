// Borrowed.
// https://gist.github.com/benbuckman/2758563
// Intercept writeStream to pass output thru callback.
//
//
// returns an unhook() function, call when done intercepting
var errors = {inputTypeError: new TypeError('tapit: input must be stream.Writable')};
module.exports = function(writeStream, tap) {

    if (!writeStream.write || !writeStream.writable)
        throw errors.inputTypeError;

    var old_writeStream_write = writeStream.write;

    writeStream.write = (function(write) {
        return function(string, encoding, fd) {
            var args = [].slice.call(arguments);
            args[0] = interceptor(string, tap);
            write.apply(writeStream, args);
        };
    }(writeStream.write));

    function interceptor(string, callback) {
        // only intercept the string
        var result = callback(string);
        if(typeof result == 'string') {
            string = result.replace(/\n$/, '') + (result && (/\n$/).test(string) ? '\n' : '');
        }
        return string;
    }

    // puts back to original
    return function unhook() {
        writeStream.write = old_writeStream_write;
    };

};

if(process.env.NODE_ENV === 'test') {
    module.exports.errors = errors;
}
