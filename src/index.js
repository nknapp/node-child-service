const cp = require("child_process");
const debug = require("debug")("childcare:index");

module.exports = {
	spawn,
	kill,
};

async function spawn(command, args, options) {
	const child = cp.spawn(command, args);
	await Promise.race([
		findPattern(child.stdout, options.readyRegex),
		shouldNotTerminate(child),
	]);
	return child;
}

async function kill(childProcess) {
	const terminationPromise = awaitTermination(childProcess);
	childProcess.kill();
	await terminationPromise;
}

async function findPattern(readableStream, regex) {
	if (regex == null) {
		debug("No readyRegex provided!");
		return Promise.resolve();
	}
	return new Promise((resolve) => {
		let contents = "";
		readableStream.on("data", (buffer) => {
			contents += buffer.toString("utf8");
			debug(`Checking for ${regex} on output: ${contents}`);
			if (contents.match(regex)) {
				debug("Pattern found");
				resolve(true);
			}
		});
	});
}

async function shouldNotTerminate(process) {
	const exitCode = await awaitTermination(process);
	throw new Error(`Process terminated with exit-code ${exitCode}`);
}

async function awaitTermination(process) {
	return new Promise((resolve) => {
		process.on("exit", (code) => {
			resolve(code);
		});
	});
}
