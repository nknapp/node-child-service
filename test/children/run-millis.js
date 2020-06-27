const { run, delay } = require("../helpers");

run(async function () {
	console.log("Started");
	let milliSeconds = Number(process.argv[2]);
	await delay(milliSeconds);
	console.log("Stopping");
});
