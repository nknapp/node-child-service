const debug = require("debug")("child-service:find-pattern");

module.exports = {
	waitForMatch,
};

async function waitForMatch({readable, limit, regex }) {
	if (readable == null) {
		throw new Error('readable is required')
	}
	if (regex == null) {
		throw new Error('regex is required')
	}
	if (limit == null) {
		throw new Error('limit is required')
	}

	return new Promise((resolve, reject) => {
		const outputBuffer = Buffer.alloc(limit);
		let writeIndex = 0;

		readable.on("data", (buffer) => {
			buffer.copy(outputBuffer, writeIndex);
			writeIndex += buffer.length;

			const contents = outputBuffer.toString("utf8", 0, writeIndex);
			let patternFound = Boolean(contents.match(regex));
			debug(
				`Checking for ${regex} (found: ${patternFound}) on output: ${contents}`
			);
			if (patternFound) {
				return resolve();
			}
			if (writeIndex > limit) {
				return reject(
					new Error(
						`Pattern not found within the first ${limit} bytes of the stream`
					)
				);
			}
			debug("Continue waiting for data");
		});
	});
}
