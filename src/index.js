const { waitForMatch } = require("./lib/wait-for-match");
const { WatchedChildProcess } = require("./lib/watched-child-process.js");
const cp = require("child_process");
const debug = require("debug")("child-service:index");

/**
 * The class for starting and stopping services.
 * @public
 */
class ChildService {
	/**
	 * Create a new child-service
	 *
	 * @param {object} userOptions parameters
	 * @param {string|Promise<string>} userOptions.command the command to execute
	 * @param {string[]|Promise<string[]>=} userOptions.args arguments to the command
	 * @param {RegExp?} userOptions.readyRegex process is assumed to be ready, when this regex matches the output.
	 * @param {number?} userOptions.outputLimit only look for readyRegex in the first "outputLimit" number of bytes of the output.
	 * @param {object?} userOptions.spawnOptions options to pass to child_process.spawn
	 * @param {number?} userOptions.timeoutAfterSignal how long (in milliseconds) to wait after stopping the child with SIGTERM, before using SIGKILL and
	 *    after that before giving up.
	 * @param {boolean?} userOptions.listenOnStderr (default: false) whether to wait for "readyRegex" on stderr of the child-process instead of stdout
	 * @public
	 * @returns {Promise<ChildProcessWithoutNullStreams>}
	 */
	constructor(userOptions) {
		this.userOptions = userOptions;
		this.watchedChildProcess = null;
		this.supervisor = null;

		// We need this line in order to access "this" from within the listener
		this._onTerminatingSignal = this._onTerminatingSignal.bind(this);
		this.stop = this.stop.bind(this);
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
			listenOnStderr: false,
			...this.userOptions,
		};

		this.watchedChildProcess = new WatchedChildProcess(
			await options.command,
			await options.args,
			options.spawnOptions
		);

		this._ensureStopChildProcessAfterParentDies();

		let searchedOutput = options.listenOnStderr
			? this.watchedChildProcess.childProcess.stderr
			: this.watchedChildProcess.childProcess.stdout;

		await Promise.race([
			waitForMatch({
				readable: searchedOutput,
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

	_ensureStopChildProcessAfterParentDies() {
		let childProcess = this.watchedChildProcess.childProcess;
		if (childProcess.pid == null) {
			debug("Not tracking parent death, because child didn't correctly start.");
			return;
		}
		process.on("SIGINT", this._onTerminatingSignal);
		process.on("SIGTERM", this._onTerminatingSignal);
		this.supervisor = cp.fork(require.resolve("./lib/supervisor.js"), [
			String(childProcess.pid),
		]);
		childProcess.once("exit", () => {
			this.supervisor.send("exit");
		});
	}

	/* istanbul ignore next This code is covered, but it is executed in a child process */
	async _onTerminatingSignal(signal) {
		await this.stop();
		if (process.listenerCount(signal) === 0) {
			process.kill(process.pid, signal);
		}
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
		await this.watchedChildProcess.stop(
			this.userOptions.timeoutAfterSignal || 1000
		);
		process.off("SIGTERM", this._onTerminatingSignal);
		process.off("SIGINT", this._onTerminatingSignal);
		this.watchedChildProcess = null;
	}

	/**
	 * @private
	 */
	async _waitForExit() {
		return this.watchedChildProcess.exitPromise;
	}
}

module.exports = { ChildService };
