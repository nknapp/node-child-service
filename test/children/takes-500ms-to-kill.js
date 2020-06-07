const { run, delay } = require("../helpers");

process.on("SIGTERM", async function () {
	console.log("SIGTERM received");
	await delay(500).then(() => {
		process.exit(0);
	});
});
run(async function () {
	console.log("Now I am ready");
	await delay(10000);
});
