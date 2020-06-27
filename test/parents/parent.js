const { run } = require("../helpers");
const ChildService = require("../../");

const childExecutable = process.argv.slice(2);

const childService = new ChildService({
	command: process.argv0,
	args: childExecutable,
	readyRegex: /Now I am ready/,
	waitAfterSignal: 250,
});

run(async () => {
	const childProcess = await childService.start();
	process.send(childProcess.pid);
	process.on("message", (message) => {
		if (message === "exit") {
			process.exit(0);
		} else if (message === "throw") {
			throw new Error("Test-Error");
		}
	});
});
