const http = require("http");

http
	.createServer((req, res) => {
		console.log("Incoming request");
		res.end("hello\n");
	})
	.listen(3000, () => {
		console.log("Listening on port 3000");
	});
