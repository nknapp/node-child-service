const path = require("path");

module.exports = {
	"multiple-writes-per-line.js": resolveChild("multiple-writes-per-line.js"),
	"ready-after-500ms.js": resolveChild("ready-after-500ms.js"),
	"ready-at-once.js": resolveChild("ready-at-once.js"),
	"refuse-to-stop.js": resolveChild("refuse-to-stop.js"),
	"stop-before-ready.js": resolveChild("stop-before-ready.js"),
	"takes-500ms-to-kill.js": resolveChild("takes-500ms-to-kill.js"),
	"stop-immediately.js": resolveChild("stop-immediately.js"),
	"run-millis.js": resolveChild("run-millis.js"),
};

function resolveChild(name) {
	return path.relative(".", path.join(__dirname, "children", name));
}
