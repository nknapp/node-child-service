const { run, delay } = require("../helpers");

run(async function () {
	process.stdout.write("Now");
	await delay(100);
	process.stdout.write(" I");
	await delay(100);
	process.stdout.write(" am");
	await delay(100);
	process.stdout.write(" ready\n");
	await delay(1000);
});
