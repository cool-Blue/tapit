const expect = require("chai").expect,
    fs     = require('fs'),
    logEvents = require('@cool-blue/logevents')();
    tapit  = require("../tapit.js");

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
    });
    describe("when passed a readable stream", function() {

        var content = ["capture-this!", "日本語", "-k21.12-0k-ª–m-md1∆º¡∆ªº"];

        function reset(inFile, content, stream){

            var _content;

            //reset the test input
            try {
                fs.unlinkSync(inFile);
            } catch(e) {
                // just ignore it
                console.warn("WARNING: inFile does not exist")
            }

            _content = content.reduce(function(res, line) {
                return res + line + "\n";
            }, "");
            fs.writeFileSync(inFile, _content);

            process.on('message', function(m){
                console.log(m)
            });

            //return the file content for reference
            return _content;
        }

        function readAll(next) {
            var stream = this;
            var body = "";

            function readChunk (fromreadit) {
                var chunk;
                chunk = stream.read();
                body += chunk;
            }
            function onClose(fromreadit){
                next.bind(stream)(body)

                this.removeListener('readable', readChunk);
                this.removeListener('close', onClose);
            }

            this
                .on('readable', ((onreadable) => {
                    return readChunk
                })())
                .on('close', ((onclose) => {
                    return onClose
                })());

            return this;
        }


        [
            /*
             {
             name: 'stdin',
             stream: function() {
             return process.stdin
             }

             },
             */
            {
                name: 'read stream',
                inFile: './test/fixtures/input.txt',
                stream: function() {
                    var s = fs.createReadStream(this.inFile);
                    s.readAll = readAll;

                    // log events from the Stream
                    var streamEvents = ['pipe', 'unpipe', 'finish', 'cork', 'close', 'drain', 'error', 'end', 'readable'];
                    logEvents.open((s.name = "stream", s), streamEvents);

                    return s
                },
                inStream: function() {
                    return fs.createWriteStream(this.inFile)
                }
            }

        ].forEach(function(streamDescriptor) {

            describe('when ' + streamDescriptor.name + ' is passed as the first argument', function() {

                describe('if ' + streamDescriptor.name + ' is in flowing mode', function() {

                    describe("when the stream is not modified", function() {

                        var _stream, _content, desc,

                            scenarios = [
                                {
                                    returns: "doesn't return",
                                    cb: function(captured_text) {
                                        return function(txt) {
                                            captured_text.content += txt;
                                        }
                                    }
                                },
                                {
                                    returns: "returns",
                                    cb: function(captured_text) {
                                        return function(txt) {
                                            captured_text.content += txt;
                                            return txt
                                        }
                                    }
                                }
                            ];

                        scenarios.forEach(function(desc) {

                            it("when cb " + desc.returns
                                + " a string, should capture " + streamDescriptor.name
                                + " when initialized and not when it is unhooked", function(done) {

                                _content = reset(streamDescriptor.inFile, content, _stream);

                                var _stream = streamDescriptor.stream();

                                // Lets set up our intercept
                                var captured_text = {};
                                captured_text.content = ""
                                var unhook = tapit(_stream, desc.cb(captured_text));

                                // Make sure we don't see the captured text yet.
                                expect(captured_text.content).to.not.have.string(_content);

                                // read from the console or the test file
                                _stream.readAll(readResult => {
                                    // Make sure we have the captured text.
                                    expect(captured_text.content).to.have.string(readResult);

                                    // Make sure the text is not captured after unhook

                                    unhook();
                                    captured_text.content = "";

                                    var _stream = streamDescriptor.stream();

                                    // read from the stream.
                                    _stream.readAll(() => {
                                        // Make sure we have not captured text.
                                        expect(captured_text.content).to.be.equal("");
                                        done();
                                    })
                                });
                            });
                        });
                    });

/*
                    _content = reset(streamDescriptor.inFile, content);

                    stream = streamDescriptor.stream();

                    it("should modify output if callback returns a string", function() {

                         var captured = [];
                         var unhook = tapit(stream, function(txt) {
                             var mod = modified[captured.length];
                             captured.push(mod);
                             return mod;
                         });

                         var modified = ["print-this!", "asdf", ""];

                         content.forEach(function(txt) {
                             _content = reset(streamDescriptor.inFile, txt);
                             // send to stdout.
                             stream.read();
                             // make sure captured doesn't contain the original text
                             expect(captured).to.not.contain(txt);
                         });

                         expect(captured).to.eql(modified);

                         unhook();

                     });
*/
                })
            });
        });
    })
});
