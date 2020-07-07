const { promisify } = require("util");
const stream = require("stream");
const pipeline = promisify(stream.pipeline);
const { PrefixStream } = require("./prefix-stream");
const { Sink } = require("../../test/sink");

describe("The prefix stream", () => {
	describe("injects a prefix in front of each line", () => {
		it("if newlines are at the end of a chunk", async () => {
			const sink = new Sink();
			const prefixStream = new PrefixStream("prefix: ");

			const pipe = pipeline(prefixStream, sink);

			prefixStream.write(Buffer.from("one line\n", "utf-8"));
			prefixStream.write(Buffer.from("another line\n", "utf-8"));
			prefixStream.end(Buffer.from("one more line\n", "utf-8"));

			await pipe;

			expect(sink.collectString()).toEqual(
				"prefix: one line\nprefix: another line\nprefix: one more line\n"
			);
		});
	});

	it("if newlines are in the middle of a chunk", async () => {
		const sink = new Sink();
		const prefixStream = new PrefixStream("prefix: ");

		const pipe = pipeline(prefixStream, sink);

		prefixStream.write(Buffer.from("one line\nanother line\n", "utf-8"));
		prefixStream.end(Buffer.from("one more line\nmore", "utf-8"));

		await pipe;

		expect(sink.collectString()).toEqual(
			"prefix: one line\nprefix: another line\nprefix: one more line\nprefix: more"
		);
	});

	it("for empty lines", async () => {
		const sink = new Sink();
		const prefixStream = new PrefixStream("prefix: ");

		const pipe = pipeline(prefixStream, sink);

		prefixStream.write(Buffer.from("one line\n\n\nanother line\n", "utf-8"));
		prefixStream.write(Buffer.from("\n", "utf-8"));
		prefixStream.end(Buffer.from("\n", "utf-8"));

		await pipe;

		expect(sink.collectString()).toEqual(
			"prefix: one line\n" +
				"prefix: \n" +
				"prefix: \n" +
				"prefix: another line\n" +
				"prefix: \n" +
				"prefix: \n"
		);
	});
});
