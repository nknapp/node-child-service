import { ChildService } from "child-service";

function simpleTest() {
	new ChildService({
		command: "executable",
	});
}

function withArgs() {
	new ChildService({
		command: "executable",
		args: ["some", "arguments"],
		spawnOptions: {
			cwd: "workdir",
			env: {
				VARIABLE1: "stringvalue1",
				VARIABLE2: "stringvalue2",
			},
		},
	});
}

function withSpawnOptions() {
	new ChildService({
		command: "executable",
		spawnOptions: {
			cwd: "workdir",
			env: {
				VARIABLE1: "stringvalue1",
				VARIABLE2: "stringvalue2",
			},
		},
	});
}

function withReadyRegex() {
	new ChildService({
		command: "executable",
		readyRegex: / Connected /,
	});
}

function withTimeout() {
	new ChildService({
		command: "executable",
		timeoutAfterSignal: 3000,
	});
}

function withOutputLimit() {
	new ChildService({
		command: "executable",
		outputLimit: 10000,
	});
}

function withPromisesAsCommandAndArgs() {
	new ChildService({
		command: Promise.resolve("executable"),
		args: Promise.resolve(["1", "2"]),
	});
}
