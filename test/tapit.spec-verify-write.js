const expect    = require("chai").expect,
      fs        = require('fs'),
      eventsLog = './test/output/event-log.txt',
      logEvents = require('@cool-blue/logevents')(eventsLog);
tapit = require("../tapit.js");

describe("tapit", function() {
    /*
     after(function(){
     fs.createReadStream(eventsLog).pipe(process.stdout)
     });
     */

    function logStreamEvents(s) {
        return
        // log events from the Stream
        var streamEvents = ['pipe', 'unpipe', 'finish', 'cork', 'close', 'drain', 'error', 'end', 'readable'];
        logEvents.open((s), streamEvents);

    }

    function readAll(next) {
        var stream = this;
        var body = "";

        function readChunk(fromreadit) {
            var chunk;
            chunk = stream.read();
            body += chunk;
        }

        function onClose(fromreadit) {
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

    describe("when passed a writable stream", function() {
        [
            /*
             {
             name: 'stdout',
             stream: function() {
             return process.stdout
             }

             },
             */
            {
                name: 'writeStream',
                outFile: './test/output/out-file.txt',
                stream: function() {
                    var s = fs.createWriteStream(this.outFile);
                    s.name = this.name;
                    logStreamEvents(s);
                    return s
                }
            }

        ].forEach(function(streamDescriptor) {

            describe('when ' + streamDescriptor.name + ' is passed as the first argument', function() {

                var _stream;

                describe("should capture " + streamDescriptor.name
                    + " when initialized and not when it is unhooked", function(done) {

                    _stream = streamDescriptor.stream();

                    // Lets set up our intercept
                    var captured_text = "";
                    var unhook = tapit(_stream, function(txt) {
                        captured_text += txt;
                    });

                    // Lets try each of these pieces of text
                    var arr = ["capture-this!", "日本語", "-k21.12-0k-ª–m-md1∆º¡∆ªº"];
                    arr.forEach(function(txt, i, a) {

                        it("before writing " + txt + " capture text should be clean", function() {
                            // Make sure we don't see the captured text yet.
                            expect(captured_text, "captured text is clean").to.not.have.string(txt);
                        });

                        it("should write " + txt + " to the file", function(){
                            // send to the stream.
                            _stream.write(txt, "utf8", function(e){
                                readAll.bind(fs.createReadStream(_stream.path))(function(body) {
                                    // Make sure we have wirtten the text.
                                    expect(body, "text was written").to.have.string(txt, "txt to have");
                                    done()
                                })
                            });
                        });

                        // Make sure we have the captured text.
                        it("should capture the text", function(){
                            expect(captured_text, "text was captured").to.have.string(txt);
                        })

                    });

/*
                    unhook();
                    captured_text = "";

                    arr = ["capture-this!", "日本語", "-k21.12-0k-ª–m-md1∆º¡∆ªº"];
                    arr.forEach(function(txt) {

                        // send to the stream.
                        _stream.write(txt);

                        // Make sure we have not captured text.
                        expect(captured_text).to.be.equal("");
                    });
*/

                });

                it.skip("should modify output if callback returns a string", function() {

                    _stream = streamDescriptor.stream();

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
    describe.skip("when passed a readable stream", function() {

        var content = ["capture-this!", "日本語", "-k21.12-0k-ª–m-md1∆º¡∆ªº"];

        function reset(inFile, content, stream) {

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

            //return the file content for reference
            return _content;
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
                name: 'readStream',
                inFile: './test/fixtures/input.txt',
                stream: function() {
                    var s = fs.createReadStream(this.inFile);
                    s.readAll = readAll;

                    s.name = this.name;
                    logStreamEvents(s);

                    return s
                },
                inStream: function() {
                    return fs.createWriteStream(this.inFile)
                }
            }

        ].forEach(function(streamDescriptor) {

            describe('when ' + streamDescriptor.name + ' is passed as the first argument', function() {

                describe('when ' + streamDescriptor.name + ' is in flowing mode', function() {

                    describe("when the stream is not modified", function() {

                        scenarios = [
                            {
                                returns: "doesn't return anything",
                                cb: function(captured_text) {
                                    return function(txt) {
                                        captured_text.content += txt;
                                    }
                                }
                            },
                            {
                                returns: "returns the captured text",
                                cb: function(captured_text) {
                                    return function(txt) {
                                        captured_text.content += txt;
                                        return txt
                                    }
                                }
                            }/*,
                             {
                             returns: "returns",
                             cb: function(captured_text) {
                             return function(txt) {
                             captured_text.content += txt;
                             return txt
                             }
                             }
                             }
                             */
                        ];

                        scenarios.forEach(function(desc) {
                            var _stream, captured_text, unhook;
                            var _content = reset(streamDescriptor.inFile, content, _stream);

                            describe("when cb " + desc.returns, function() {

                                beforeEach(function() {
                                    // reference a new stream connected to the input file
                                    _stream = streamDescriptor.stream();

                                    // Set up the intercept
                                    captured_text = {};
                                    captured_text.content = "";
                                    unhook = tapit(_stream, desc.cb(captured_text));

                                    // Make sure we don't see the captured text yet.
                                    expect(captured_text.content).to.not.have.string(_content);
                                });

                                it("should capture " + streamDescriptor.name,
                                    function(done) {

                                        // read from the console or the test file
                                        // and return the result to a callback
                                        _stream.readAll(readResult => {
                                            // Make sure we have the captured text
                                            // and it matches the file contents
                                            expect(captured_text.content).to.have.string(readResult);
                                            done();
                                        })
                                    }
                                );
                                it("should not capture after it is unhooked",
                                    function(done) {

                                        unhook();

                                        // read from the console or the test file
                                        // and return the result to a callback
                                        _stream.readAll(() => {
                                            // Make sure we have not captured text.
                                            expect(captured_text.content).to.equal("");
                                            done();
                                        })
                                    }
                                );
                            })
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
