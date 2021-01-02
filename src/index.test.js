const { ChildService } = require("./index");
const cp = require("child_process");
const { ChildProcess } = cp;
const { measureMillis, delay } = require("../test/helpers");
const processExists = require("process-exists");
const testExecutables = require("../test/test-executables");

describe("The child-service package", () => {
	let service = null;

	afterEach(async () => {
		if (service != null) {
			await service.stop();
			service = null;
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

			it("if the matching line is written to stderr and 'listenOnStderr' is set to true", async () => {
				service = new ChildService({
					command: process.argv0,
					args: ["test/children/ready-after-500ms-on-stderr.js"],
					readyRegex: /Now I am ready/,
					listenOnStderr: true,
				});

				const { duration, result } = await measureMillis(() => service.start());

				expect(result).toBeInstanceOf(ChildProcess);
				expect(duration).toBeGreaterThan(200);
				expect(duration).toBeLessThan(1000);
			});
		});

		it("returns immediately if the no readyRegex is provided", async () => {
			service = new ChildService({
				command: delay(100).then(() => process.argv0),
				args: delay(200).then(() => ["test/children/ready-after-500ms.js"]),
			});

			const { duration, result } = await measureMillis(() => service.start());

			expect(result).toBeInstanceOf(ChildProcess);
			expect(duration).toBeGreaterThan(0);
			expect(duration).toBeLessThan(400);
		});

		it("accepts promises as command and args", async () => {
			service = new ChildService({
				command: delay(100).then(() => process.argv0),
				args: delay(200).then(() => ["test/children/ready-after-500ms.js"]),
				readyRegex: /Now I am ready/,
			});

			const { duration, result } = await measureMillis(() => service.start());

			expect(result).toBeInstanceOf(ChildProcess);
			expect(duration).toBeGreaterThan(400);
			expect(duration).toBeLessThan(1200);
		});

		it('starting the service passes spawnOptions to "child_process.spawn"', async () => {
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

	describe("the child-process should be stopped automatically", () => {
		it("if the parent exits", async () => {
			const { parentProcess, childPid } = await runParentWithChild(
				testExecutables["parent.js"],
				testExecutables["ready-at-once.js"]
			);
			parentProcess.send("exit");
			await delay(500);

			expect(await processExists(childPid)).toBe(false);
			expect(await processExists(parentProcess.pid)).toBe(false);
		});

		describe("with a child process that is easy to stop", () => {
			it(`if the parent is killed with SIGINT`, () =>
				checkKillWithSignal("SIGINT", testExecutables["ready-at-once.js"]));
			it(`if the parent is killed with SIGTERM`, () =>
				checkKillWithSignal("SIGTERM", testExecutables["ready-at-once.js"]));
			it(`if the parent is killed with SIGKILL`, () =>
				checkKillWithSignal("SIGKILL", testExecutables["ready-at-once.js"]));
		});

		describe("if the child process refuses to stop", () => {
			it(`if the parent is killed with SIGINT`, () =>
				checkKillWithSignal("SIGINT", testExecutables["refuse-to-stop.js"]));
			it(`if the parent is killed with SIGTERM`, () =>
				checkKillWithSignal("SIGTERM", testExecutables["refuse-to-stop.js"]));
			it(`if the parent is killed with SIGKILL`, () =>
				checkKillWithSignal("SIGKILL", testExecutables["refuse-to-stop.js"]));
		});
	});
});

async function checkKillWithSignal(signal, testExecutable) {
	const { parentProcess, childPid } = await runParentWithChild(
		testExecutables["parent.js"],
		testExecutable
	);
	parentProcess.kill(signal);
	await delay(1000);

	expect(await processExists(childPid)).toBe(false);
	expect(await processExists(parentProcess.pid)).toBe(false);
}

async function runParentWithChild(parentExecutable, childExecutable) {
	const parentProcess = cp.fork(parentExecutable, [childExecutable]);
	const childPid = await new Promise((resolve) => {
		parentProcess.on("message", resolve);
	});
	return {
		parentProcess,
		childPid,
	};
}
