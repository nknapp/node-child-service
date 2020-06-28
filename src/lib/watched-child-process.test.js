const { WatchedChildProcess } = require("./watched-child-process");
const testExecutables = require("../../test/test-executables");
const { measureMillis, delay } = require("../../test/helpers");

describe("the WatchedChildProcess", () => {
	describe("after starting a non-existing executable", () => {
		it("has 'exited' status", async () => {
			const child = new WatchedChildProcess("non-existing-file");
			child.childProcess.on("error", (error) => {
				expect(error.code).toEqual("ENOENT");
			});
			await delay(500);
			expect(child.exited).toBe(true);
		});
	});

	describe("after starting an existing executable", () => {
		it("is 'running'", () => {
			const child = new WatchedChildProcess(process.argv0, [
				testExecutables["run-millis.js"],
				"1000",
			]);
			expect(child.exited).toBe(false);
		});

		it("is 'running' as long as the process runs", async () => {
			const child = new WatchedChildProcess(process.argv0, [
				testExecutables["run-millis.js"],
				"1000",
			]);
			await delay(100);
			expect(child.exited).toBe(false);
		});

		it("changes to 'exited' when the process stops by itself", async () => {
			const child = new WatchedChildProcess(process.argv0, [
				testExecutables["run-millis.js"],
				"50",
			]);

			await delay(500);
			expect(child.exited).toBe(true);
		});

		it("changes to 'exited' when the process is terminated", async () => {
			const child = new WatchedChildProcess(process.argv0, [
				testExecutables["run-millis.js"],
				"50",
			]);

			await delay(500);
			child.childProcess.kill("SIGTERM");
			expect(child.exited).toBe(true);
		});

		it("changes to 'exited' status when the process is killed", async () => {
			const child = new WatchedChildProcess(process.argv0, [
				testExecutables["run-millis.js"],
				"50",
			]);

			await delay(500);
			child.childProcess.kill("SIGKILL");
			expect(child.exited).toBe(true);
		});
	});

	describe("stopping a started child-process", () => {
		it("should return immediately if process is not running", async () => {
			const child = new WatchedChildProcess(process.argv0, [
				testExecutables["run-millis.js"],
				"50",
			]);
			await delay(500);
			expect(child.exited).toBe(true);

			const { duration } = await measureMillis(() => child.stop(5000));

			expect(duration).toBeLessThan(200);
			expect(child.exited).toBe(true);
		});

		it("should return once a process stops after SIGTERM", async () => {
			const child = new WatchedChildProcess(process.argv0, [
				testExecutables["run-millis.js"],
				"10000",
			]);
			expect(child.exited).toBe(false);
			await delay(100);

			const { duration } = await measureMillis(() => child.stop(5000));

			expect(child.exited).toBe(true);
			expect(duration).toBeLessThan(200);
		});

		it("should attempt SIGKILL if a process refuses to stop", async () => {
			const child = new WatchedChildProcess(process.argv0, [
				testExecutables["refuse-to-stop.js"],
			]);
			expect(child.exited).toBe(false);
			await delay(500);

			const { duration } = await measureMillis(() => child.stop(500));

			expect(child.exited).toBe(true);
			expect(duration).toBeGreaterThan(500);
			expect(duration).toBeLessThan(1000);
		});
	});
});
