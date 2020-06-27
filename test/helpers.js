/* istanbul ignore file */
module.exports = {
	async delay(milliSeconds) {
		return new Promise((resolve) => setTimeout(resolve, milliSeconds));
	},
	run(fn) {
		fn().catch((error) => {
			console.error(error.message + "\n" + error.stack);
		});
	},
	async measureMillis(fn) {
		const start = Date.now();
		const result = await fn();
		return {
			result,
			duration: Date.now() - start,
		};
	},
};
