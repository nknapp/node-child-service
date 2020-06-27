const { run, delay } = require("../helpers");

run(async function () {
	["SIGINT", "SIGTERM"].forEach((signal) => {
		trapSignal(signal);
	});

	console.log("Now I am ready");
	console.log("PID: " + process.pid);
	await delay(20000);
	console.log("test");

	function trapSignal(signal) {
		process.on(signal, () => console.log("Received signal: " + signal));
	}
});
