const ChildService = require("../");
const got = require("got");

// We call nodejs in this example, but in reality, it
// is probably some binary executable.
const childService = new ChildService({
	command: process.execPath,
	args: ["service.js"],
	readyRegex: /Listening on port 3000/,
	spawnOptions: {
		cwd: __dirname,
	},
});

(async function () {
	await childService.start();
	console.log("Started!")

	const response = await got("http://127.0.0.1:3000")
	console.log(response.body)

	await childService.stop();
	console.log("Stopped!");
})();
