const { spawn, kill } = require("../");


(async function () {
	process.env.DEBUG = "child-service:*";

	const child = await spawn(process.argv0, "service.js", {
		readyRegex: /Ready/,
    spawnOptions: {
		  cwd: __dirname
    }
	});

	child.stdout.pipe(process.stdout)
  await delay(1000);
	await kill(child);

})();

async function delay(milliSeconds) {
  await new Promise(resolve => setTimeout(resolve, milliSeconds))
}
