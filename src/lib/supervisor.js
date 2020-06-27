const debug = require("debug")("child-service:supervisor");

// As a last resort, if the parent process is killed,
// this process will also kill the child-process

const childPid = Number(process.argv[2]);

process.once("disconnect", async () => {
	debug(`Sending SIGKILL to ${childPid} because parent has disconnected`);
	try {
		process.kill(childPid, "SIGKILL");
	} catch (error) {
		console.warn(`Unable to kill ${childPid}!`);
		debug(error);
	}
	process.exit(0);
});

process.on("message", (message) => {
	if (message === "exit") {
		process.exit(0);
	}
});

process.on("unhandledRejection", (rejection) => {
	console.log("REJECTION", rejection);
});
