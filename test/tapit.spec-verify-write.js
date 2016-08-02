const expect    = require("chai").expect,
      fs        = require('fs'),
      readAll   = require('../readstream'),
      eventsLog = './test/output/event-log.txt',
      logEvents = require('@cool-blue/logevents')(eventsLog),
      tapit     = require("../tapit.js");

/*
 after(function(){
 fs.createReadStream(eventsLog).pipe(process.stdout)
 });
 */

function logStreamEvents(s) {
    // return
    // log events from the Stream
    var streamEvents = ['pipe', 'unpipe', 'finish', 'cork', 'close', 'drain', 'error', 'end', 'readable'];
    logEvents.open((s), streamEvents);

}

/**
 * Re-initialises the test input file with supplied content
 * @function
 * @param {string} inFile
 * @param {string[]} content an array of lines to be written
 * @returns {string} content written to the file
 */
function resetFile(inFile, content) {

    var _content;

    //resetFile the test input
    try {
        fs.unlinkSync(inFile);
    } catch(e) {
        // just ignore it
        console.warn("WARNING: inFile does not exist")
    }

    _content = content
        ? content.length
           ? content.reduce(function(res, line) {
                return res + line + "\n";
            }, "")
           : content
        : "";
    fs.writeFileSync(inFile, _content);
    //return the file content for reference
    return _content;
}

describe("when passed a writable stream", function() {

    [
        {
            name: "through",
            captured0:"",
            captured: "",
            unhook: undefined,
            tap: function(stream) {
                // Lets set up our intercept
                this.unhook = tapit(stream, function(txt) {
                    this.captured += txt;
                }.bind(this));
            },
            init: function(){
                this.captured = this.captured0;
            }
        },
        {
            name: "transform",
            captured0: [],
            captured: [],
            unhook: undefined,
            tap: function (stream) {
                this.unhook = tapit(stream, function(txt) {
                    var mod = this.modified[this.captured.length];
                    this.captured.push(mod);
                    return mod;
                }.bind(this));
            },
            modified: ["print-this!", "asdf", "78r9ya"],
            init: function(){
                this.captured = this.captured0;
            }
        },
    ].forEach(function(mode){
        [
            {
                name: 'writeStream',
                outFile: './test/output/out-file.txt',
                stream: function() {
                    var s = fs.createWriteStream(this.outFile);
                    s.name = this.name;
                    logStreamEvents(s);
                    return s
                },
                init: function(){
                    resetFile(this.outFile);
                }
            },
            {
                name: 'stdout',
                stream: function() {
                    return process.stdout
                },
                init: function(){}
            },

        ].forEach(function(streamDescriptor) {

            describe('when in '+ mode.name +' mode and '
                + streamDescriptor.name + ' is passed', function() {

                var arr = ["capture-this!", "日本語", "-k21.12-0k-ª–m-md1∆º¡∆ªº"];

                var _stream;


                it("reset the stream", function (done){
                    _stream = streamDescriptor.stream();
                    done()
                });

                describe("When hooked", function() {

                    arr.forEach(function(txt, i, a) {

                        var output = mode.modified ? mode.modified[i] : txt;

                        it("before writing capture text should be clean", function(done) {
                            // Make sure we don't see the captured text yet.
                            expect(mode.captured, "captured text is clean").to.not.include(txt);
                            done()
                        });

                        it("should write '" + output + "' to the stream", function(done) {
                            var s = readAll.readBack(_stream);
                            // need to limit the time that the stream is tapped because
                            // mocha writes to stdout and this traffic will interfere.
                            mode.tap(_stream);
                            // send to the stream.
                            s.write(txt, "utf8", function(e) {
                                if(s.readAll)
                                    s.readAll(function(body) {
                                        // Make sure we have wirtten the text.
                                        expect(body, "text was written")
                                            .to.have.string(output, "txt to have");
                                        mode.unhook();
                                        done()
                                    });
                                else {
                                    // need to pipe to a file in the command line and check the result
                                    expect(true).to.equal(true);
                                    mode.unhook();
                                    done()
                                }
                            });
                        });

                        // Make sure we have the captured text.
                        it("should capture '" + output + "'", function(done) {
                            expect(mode.captured).to.include(output);
                            done()
                        })
                    });

                    it("should accumulate the capture", function(done) {
                        expect(mode.captured)
                            .to.eql(mode.modified || arr.reduce((res, l) => res + l, ""));
                        done()
                    });
                });

                describe("...and not when un-hooked", function() {

                    it("reset the stream", function (done){
                        _stream = streamDescriptor.stream();
                        done()
                    });

                    it("should not capture", function() {
                        mode.tap(_stream);
                        mode.unhook();
                        mode.captured = mode.captured0;

                        arr.forEach(function(txt) {

                            // send to the stream.
                            _stream.write(txt);

                            // Make sure we have not captured text.
                            expect(mode.captured).to.be.equal(mode.captured0);
                        });
                    })
                });
            });
        });
    })
});
describe("when passed a readable stream", function() {


    var content = ["capture-this!", "日本語", "-k21.12-0k-ª–m-md1∆º¡∆ªº"];
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
                        var _content = resetFile(streamDescriptor.inFile, content);

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
                                    _stream.readAll(body => {
                                        // Make sure we have the captured text
                                        // and it matches the file contents
                                        expect(captured_text.content).to.have.string(body);
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
             _content = resetFile(streamDescriptor.inFile, content);

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
             _content = resetFile(streamDescriptor.inFile, txt);
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
