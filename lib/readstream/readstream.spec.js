/**
 * Created by cool.blue on 8/1/2016.
 */
const ows = require('./index').readBack;
const outFile = test_readstream

describe("ReadAllAdd", function(){
    const str = "this is a bunch of test text";
    var s = ows(process.stdout);

    process.stdout.write(str);

    it("write to a temp file",function(){
        s.write(str, "utf8", function(e) {
            s.readAll(function(body) {
                expect(body).to.have.string(str)
            })
        })
    })
});