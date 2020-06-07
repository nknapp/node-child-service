const { spawn, kill } = require("../src/index");

describe("The childcare package", () => {
	it("should run a child-process", async () => {
		const now = Date.now();
		await spawnNodeJsProgram(
			require.resolve("./children/ready-after-500ms.js"),
			/Now I am ready/
		);
		const duration = Date.now() - now;
		expect(duration).toBeLessThan(1000);
		expect(duration).toBeGreaterThan(200);
	});

	it("should throw if the child process exits before the readyRegex is found", async () => {
		let promise = spawnNodeJsProgram(
			require.resolve("./children/stop-before-ready.js"),
			/Now I am ready/
		);
		await expect(promise).rejects.toThrow(
			/Process terminated with exit-code 0/
		);
	});

	it("awaits termination", async () => {
		const child = await spawnNodeJsProgram(
			require.resolve("./children/takes-500ms-to-kill.js"),
			/Now I am ready/
		);
		await kill(child);
	});
});

async function spawnNodeJsProgram(path, readyRegex) {
	return spawn(process.argv0, [path], { readyRegex });
}
