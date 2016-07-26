# Node.js Intercept write streams

> tapit captures or modifies a node js write stream.

> _<sup>Based on [this](https://gist.github.com/benbuckman/2758563) gist</sup>_

## Capture
```javascript
var intercept = require("tapit"),
	captured_text = "",
	_stream = fs.createWriteStream(outFile);

var unhook_intercept = intercept(_stream, function(txt) {
	captured_text += txt;
});

_stream.write("This text is being captured");

// Let's stop capturing stdout.
unhook_intercept();

_stream.write("This text is not being captured");
```

## Modify
```javascript
var intercept = require("tapit");

var unhook_intercept = intercept(_stream, function(txt) {
	return txt.replace( /this/i , 'that' );
});

_stream.write("This text is being modified");
// -> that text is being modified
```

## Test

	npm install
	npm test

## About Colorization

Popular modules such as [`mocha`](http://mochajs.org/) and [`winston`](https://github.com/winstonjs/winston) may colorize output by inserting ANSI escape codes into the output stream. Both `mocha` and `winston` make multiple calls to the output streams while colorizing a line -- in order to be robust, your code should anticipate and deal with this.
