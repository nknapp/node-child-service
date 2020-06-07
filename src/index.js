const cp = require("child_process");
const debug = require("debug")("child-service:index");
const { waitForMatch } = require("./lib/wait-for-match");

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
	}

	/**
	 * Starts the service.
   *
	 * @returns {Promise<void>} resolves when the "readyRegex" has been found.
	 */
	async start() {
		if (this.childProcess != null && !this.childProcess.killed) {
			throw new Error("Child process is already running. Please stop first!");
		}
		const options = {
			outputLimit: 1024 * 1024,
			readyRegex: null,
			...this.userOptions,
		};
		debug(`spawning`, {
			command: options.command,
			args: options.args,
			options: options.spawnOptions,
		});
		this.childProcess = cp.spawn(
			options.command,
			options.args,
			options.spawnOptions
		);
		await Promise.race([
			waitForMatch({
				readable: this.childProcess.stdout,
				regex: options.readyRegex,
				limit: options.outputLimit,
			}),
			shouldNotError(this.childProcess),
			shouldNotTerminate(this.childProcess),
		]);
		return this.childProcess;
	}

	/**
	 * Stop the service.
	 *
	 * @returns {Promise<void>} resolves, when the executable has exited.
	 */
	async stop() {
		const terminationPromise = awaitTermination(this.childProcess);
		if (this.childProcess.killed) {
			this.childProcess = null;
			return;
		}
		this.childProcess.kill();
		await terminationPromise;
		this.childProcess = null;
	}
}

/**
 * Kills a child-process and waits untils it exits
 * @param childProcess the child-process
 * @returns {Promise<void>} promise resolves when the child-process has exited
 */

/**
 * @private
 */
async function shouldNotTerminate(childProcess) {
	const exitCode = await awaitTermination(childProcess);
	throw new Error(`Process terminated with exit-code ${exitCode}`);
}

/**
 * @private
 */
/**
 * @private
 */
async function awaitTermination(childProcess) {
	return new Promise((resolve) => {
		childProcess.on("exit", (code) => {
			resolve(code);
		});
	});
}

/**
 * @private
 */
async function shouldNotError(childProcess) {
	return new Promise((resolve, reject) => {
		childProcess.on("error", (error) => {
			reject(error);
		});
	});
}

module.exports = ChildService;
