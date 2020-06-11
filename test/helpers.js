module.exports = {
	async delay(milliSeconds) {
		return new Promise((resolve) => setTimeout(resolve, milliSeconds));
	},
	run(fn) {
		fn().catch((error) => {
			console.error(error.message + "\n" + error.stack);
		});
	},
};
