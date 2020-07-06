const { run, delay } = require("../helpers");

run(async function () {
	console.error("Not ready");
	await delay(100);
	console.error("Not ready");
	await delay(100);
	console.error("Not ready");
	await delay(100);
	console.error("Now I am ready");
	await delay(1000);
});
