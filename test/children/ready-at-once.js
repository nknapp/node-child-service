const { run, delay } = require("../helpers");

run(async function () {
	console.log("Now I am ready");
	await delay(1000);
});
