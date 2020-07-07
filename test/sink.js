const { StringDecoder } = require("string_decoder");
const stream = require("stream");

class Sink extends stream.Writable {
	constructor() {
		super();
		this.collectedString = [];
		this.stringDecoder = new StringDecoder("utf-8");
	}

	_write(chunk, encoding, callback) {
		this.collectedString.push(this.stringDecoder.write(chunk));
		callback();
	}

	collectString() {
		this.collectedString.push(this.stringDecoder.end());
		return this.collectedString.join("");
	}
}

module.exports = { Sink };
