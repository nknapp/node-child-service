const ChildService = require("./index");
const cp = require("child_process");
const { ChildProcess } = cp;
const { measureMillis } = require("../test/helpers");

describe("The child-service package", () => {
	let service = null;

	afterEach(async () => {
		if (service != null) {
			await service.stop();
		}
	});

	describe("given the service is not running yet", () => {
		describe("starting the service waits until the output matches the ready-regex", () => {
			it("if the whole matching line is written in one go", async () => {
				service = new ChildService({
					command: process.argv0,
					args: ["test/children/ready-after-500ms.js"],
					readyRegex: /Now I am ready/,
				});

				const { duration, result } = await measureMillis(() => service.start());

				expect(result).toBeInstanceOf(ChildProcess);
				expect(duration).toBeGreaterThan(200);
				expect(duration).toBeLessThan(1000);
			});

			it("if the matching line is written with multiple flushes", async () => {
				service = new ChildService({
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
		});

		it('should pass spawnOptions to "child_process.spawn"', async () => {
			const spyOnSpawn = jest.spyOn(cp, "spawn");
			service = new ChildService({
				command: process.argv0,
				args: ["children/ready-at-once.js"],
				readyRegex: /Now I am ready/,
				spawnOptions: {
					env: {
						ENV_VARIABLE: "value",
					},
					cwd: "test",
				},
			});

			await service.start();

			expect(spyOnSpawn).toHaveBeenCalledTimes(1);
			expect(spyOnSpawn).toHaveBeenCalledWith(
				process.argv0,
				["children/ready-at-once.js"],
				{
					env: {
						ENV_VARIABLE: "value",
					},
					cwd: "test",
				}
			);
		});

		it("starting the service throws an exception if the child process exits prematurely", async () => {
			service = new ChildService({
				command: process.argv0,
				args: ["test/children/stop-before-ready.js"],
				readyRegex: /Now I am ready/,
			});
			const promise = service.start();
			await expect(promise).rejects.toThrowError(
				/Process terminated with exit-code 0/
			);
		});

		it("errors while starting the service throw an exception", async () => {
			service = new ChildService({
				command: "non-existing-command",
				args: [],
				readyRegex: /Now I am ready/,
			});

			const promise = service.start();
			await expect(promise).rejects.toThrow(/ENOENT/);
		});

		it("stopping the service returns immediately without error", async () => {
			service = new ChildService({
				command: process.argv0,
				args: ["test/children/takes-500ms-to-kill.js"],
				readyRegex: /Now I am ready/,
			});

			await expect(service.stop()).resolves.not.toBeNull();
		});
	});

	describe("given the service has been stopped", () => {
		it("stopping the service returns immediately without error", async () => {
			service = new ChildService({
				command: process.argv0,
				args: ["test/children/takes-500ms-to-kill.js"],
				readyRegex: /Now I am ready/,
			});

			const child = await service.start();
			await service.stop();
			expect(child.killed).toBeTruthy();
		});
	});

	describe("given the service is running", () => {
		it("starting the service again throws an exception", async () => {
			service = new ChildService({
				command: process.argv0,
				args: ["test/children/ready-after-500ms.js"],
				readyRegex: /Now I am ready/,
			});
			await service.start();
			await expect(service.start()).rejects.toThrowError(
				/Child process is already running. Please stop first!/
			);
		});

		it("stopping the service awaits termination", async () => {
			service = new ChildService({
				command: process.argv0,
				args: ["test/children/takes-500ms-to-kill.js"],
				readyRegex: /Now I am ready/,
			});

			const child = await service.start();
			await service.stop();
			expect(child.killed).toBeTruthy();
			expect(child.exitCode).not.toBeNull();
		});
	});

	xit("if the parent dies, the child-process should be stopped", async () => {});
});
