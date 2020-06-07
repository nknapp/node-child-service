module.exports = {
	async delay(milliSeconds) {
		return new Promise((resolve) => setTimeout(resolve, milliSeconds));
	},
	run(fn) {
		fn();
	},
};
