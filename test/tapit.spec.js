var expect = require("chai").expect,
    fs = require('fs'),
    tapit = require("../tapit.js");


describe("tapit", function() {
    describe("when passed a writable stream", function() {
        [
            {
                name: 'stdout',
                stream: function() {
                    return process.stdout
                }

            },
            {
                name: 'write stream',
                outFile: './test/output/out-file.txt',
                stream: function() {
                    return fs.createWriteStream(this.outFile)
                }
            }

        ].forEach(function(streamDescriptor) {

            describe('when ' + streamDescriptor.name + ' is passed as the first argument', function() {

                var _stream;

                beforeEach(function() {
                    _stream = streamDescriptor.stream();
                });

                it("should capture " + streamDescriptor.name + " when initialized and not when it is unhooked", function() {

                    // Lets set up our intercept
                    var captured_text = "";
                    var unhook = tapit(_stream, function(txt) {
                        captured_text += txt;
                    });

                    // Lets try each of these pieces of text
                    var arr = ["capture-this!", "日本語", "-k21.12-0k-ª–m-md1∆º¡∆ªº"];
                    arr.forEach(function(txt) {

                        // Make sure we don't see the captured text yet.
                        expect(captured_text).to.not.have.string(txt);

                        // send to the stream.
                        _stream.write(txt);

                        // Make sure we have the captured text.
                        expect(captured_text).to.have.string(txt);

                    });

                    unhook();
                    captured_text = "";

                    arr = ["capture-this!", "日本語", "-k21.12-0k-ª–m-md1∆º¡∆ªº"];
                    arr.forEach(function(txt) {

                        // send to the stream.
                        _stream.write(txt);

                        // Make sure we have not captured text.
                        expect(captured_text).to.be.equal("");

                    });

                });

                it("should modify output if callback returns a string", function() {

                    var captured = [];
                    var unhook = tapit(_stream, function(txt) {
                        var mod = modified[captured.length];
                        captured.push(mod);
                        return mod;
                    });

                    var arr = ["capture-this!", "日本語", "-k21.12-0k-ª–m-md1∆º¡∆ªº"];
                    var modified = ["print-this!", "asdf", ""];

                    arr.forEach(function(txt) {
                        // send to stdout.
                        _stream.write(txt);
                        // make sure captured doesn't contain the original text
                        expect(captured).to.not.contain(txt);
                    });

                    expect(captured).to.eql(modified);

                    unhook();

                });
            });
        });
    })
    describe("when passed a readable stream", function() {
        [
            {
                name: 'stdin',
                stream: function() {
                    return process.stdin
                }

            },
            {
                name: 'read stream',
                inFile: './test/fixtures/input.txt',
                stream: function() {
                    return fs.createReadStream(this.inFile)
                }
            }

        ].forEach(function(streamDescriptor) {

            describe('when ' + streamDescriptor.name + ' is passed as the first argument', function() {

                var _stream;

                beforeEach(function() {
                    _stream = streamDescriptor.stream();
                });

                it("should throw: " + tapit.errors.inputTypeError.message, function() {

                    // Lets set up our intercept
                    expect(function(){
                        tapit(_stream, function(txt) {
                        captured_text += txt;
                    })
                    }).to.throw(tapit.errors.inputTypeError);

                });

            });
        });
    })
});
