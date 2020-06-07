const { run, delay } = require("./helpers");

run(async function () {
	console.log("Not ready");
	await delay(100);
	console.log("Not ready");
	await delay(100);
	console.log("Not ready");
	await delay(100);
});
