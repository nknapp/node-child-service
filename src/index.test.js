const ChildService = require("./index");
const { ChildProcess } = require("child_process");

describe("The child-service package", () => {
	it("should wait until the child-process is ready", async () => {
		const service = new ChildService({
			command: process.argv0,
			args: ["test/children/ready-after-500ms.js"],
			readyRegex: /Now I am ready/,
		});

		const { duration, result } = await measureMillis(() => service.start());

		expect(result).toBeInstanceOf(ChildProcess);
		expect(duration).toBeGreaterThan(200);
		expect(duration).toBeLessThan(1000);
	});

	it("should work with processes that write multiple times per line", async () => {
		const service = new ChildService({
			command: process.argv0,
			args: ["test/children/multiple-writes-per-line.js"],
			readyRegex: /Now I am ready/,
		});

		const { duration, result } = await measureMillis(() => service.start());

		expect(result).toBeInstanceOf(ChildProcess);
		expect(result.exitCode).toBeNull();
		expect(duration).toBeGreaterThan(200);
		expect(duration).toBeLessThan(1000);
	});

	it("should throw if the child process exits before the readyRegex is found", async () => {
		const service = new ChildService({
			command: process.argv0,
			args: ["test/children/stop-before-ready.js"],
			readyRegex: /Now I am ready/,
		});
		const promise = service.start();
		await expect(promise).rejects.toThrow(
			/Process terminated with exit-code 0/
		);
	});

	it("awaits termination", async () => {
		const service = new ChildService({
			command: process.argv0,
			args: ["test/children/takes-500ms-to-kill.js"],
			readyRegex: /Now I am ready/,
		});

		const child = await service.start();
		await service.stop();
		expect(child.killed).toBeTruthy();
		expect(child.exitCode).not.toBeNull();
	});

	it("returns if process is already killd", async () => {
		const service = new ChildService({
			command: process.argv0,
			args: ["test/children/takes-500ms-to-kill.js"],
			readyRegex: /Now I am ready/,
		});

		const child = await service.start();
		await service.stop();
		expect(child.killed).toBeTruthy();
	});

	xit('should pass spawnOptions to "spawn"', () => {});
});

async function measureMillis(fn) {
	const start = Date.now();
	const result = await fn();
	return {
		result,
		duration: Date.now() - start,
	};
}
