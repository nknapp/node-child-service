const { waitForMatch } = require("./wait-for-match");
const { PassThrough } = require("stream");
const { delay } = require("../../test/helpers");

describe("wait-for-match", () => {
	it("should resolve if the pattern is found", async () => {
		const stream = new PassThrough();
		const resultPromise = waitForMatch({
			readable: stream,
			limit: 1024,
			regex: /match/,
		});

		stream.write("something else\n");
		await delay(100);
		stream.write("match");
		await delay(100);

		await expect(resultPromise).resolves.toBeUndefined();
	});

	it("should resolve if the pattern is found after several data events", async () => {
		const stream = new PassThrough();
		const resultPromise = waitForMatch({
			readable: stream,
			limit: 1024,
			regex: /match/,
		});

		stream.write("something else\n");
		await delay(100);
		stream.write("ma");
		await delay(100);
		stream.write("t");
		await delay(100);
		stream.write("ch\n");
		await delay(100);

		await expect(resultPromise).resolves.toBeUndefined();
	});

	it("rejects if the limit is exceeded", async () => {
		const stream = new PassThrough();

		setImmediate(async () => {
			stream.write("ten bytes\n");
			await delay(100);
			stream.write("ma");
			await delay(100);
		});

		const resultPromise = waitForMatch({
			readable: stream,
			limit: 11,
			regex: /match/,
		});
		await expect(resultPromise).rejects.toThrow(
			/Pattern not found within the first 11 bytes of the stream/
		);
	});

	it('requires a "readable"', () => {
		expect(
			waitForMatch({ readable: null, limit: 10, regex: /abc/ })
		).rejects.toThrowError();
	});

	it('requires a "limit"', () => {
		expect(
			waitForMatch({ readable: new PassThrough(), regex: /abc/ })
		).rejects.toThrowError();
	});

	it('requires a "regex"', () => {
		expect(
			waitForMatch({ readable: new PassThrough(), limit: 10 })
		).rejects.toThrowError();
	});
});
