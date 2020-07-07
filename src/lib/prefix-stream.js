const stream = require("stream");
const { StringDecoder } = require("string_decoder");

class PrefixStream extends stream.Transform {
	constructor(prefix) {
		super();
		this.prefix = prefix;
		this.stringDecoder = new StringDecoder("utf-8");
		this.unfinishedLine = "";
	}

	_transform(chunk, encoding, callback) {
		const string = this.stringDecoder.write(chunk);
		const lines = string.split(/\n/);
		lines[0] = this.unfinishedLine + lines[0];
		this.unfinishedLine = lines.pop();
		callback(null, this._joinLines(lines));
	}

	_joinLines(lines) {
		return lines.map((line) => this.prefix + line + "\n").join("");
	}

	_flush(callback) {
		if (this.unfinishedLine.length > 0) {
			callback(null, this.prefix + this.unfinishedLine);
		} else {
			callback();
		}
	}
}

module.exports = {
	PrefixStream,
};
