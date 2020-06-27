const { waitForMatch } = require("./lib/wait-for-match");
const { WatchedChildProcess } = require("./lib/watched-child-process.js");

/**
 * The class for starting and stopping services.
 * @public
 */
class ChildService {
	/**
	 * Create a new child-service
	 *
	 * @param {object} userOptions parameters
	 * @param {string} userOptions.command the command to execute
	 * @param {string[]?} userOptions.args arguments to the command
	 * @param {RegExp?} userOptions.readyRegex process is assumed to be ready, when this regex matches the output.
	 * @param {number?} userOptions.outputLimit only look for readyRegex in the first "outputLimit" number of bytes of the output.
	 * @param {object?} userOptions.spawnOptions options to pass to child_process.spawn
	 * @public
	 * @returns {Promise<ChildProcessWithoutNullStreams>}
	 */
	constructor(userOptions) {
		this.userOptions = userOptions;
		this.watchedChildProcess = null;
	}

	/**
	 * Starts the service.
	 *
	 * @returns {Promise<void>} resolves when the "readyRegex" has been found.
	 */
	async start() {
		if (this.watchedChildProcess != null && !this.watchedChildProcess.exited) {
			throw new Error("Child process is already running. Please stop first!");
		}
		const options = {
			outputLimit: 1024 * 1024,
			readyRegex: null,
			...this.userOptions,
		};

		this.watchedChildProcess = new WatchedChildProcess(
			options.command,
			options.args,
			options.spawnOptions
		);
		await Promise.race([
			waitForMatch({
				readable: this.watchedChildProcess.childProcess.stdout,
				regex: options.readyRegex,
				limit: options.outputLimit,
			}),
			this._waitForExit(),
		]);
		if (this.watchedChildProcess.error != null) {
			throw new Error(this.watchedChildProcess.error);
		}
		if (this.watchedChildProcess.exited) {
			throw new Error(
				`Process terminated with exit-code ${this.watchedChildProcess.childProcess.exitCode}`
			);
		}
		return this.watchedChildProcess.childProcess;
	}

	/**
	 * Stop the service.
	 *
	 * @returns {Promise<void>} resolves, when the executable has exited.
	 */
	async stop() {
		if (this.watchedChildProcess == null) {
			return;
		}
		await this.watchedChildProcess.stop(1000);
		this.watchedChildProcess = null;
	}

	/**
	 * @private
	 */
	async _waitForExit() {
		return this.watchedChildProcess.exitPromise;
	}
}

module.exports = ChildService;
