const debug = require("debug")("child-service:stop-child-process");
const cp = require("child_process");

class WatchedChildProcess {
	constructor(command, args, options) {
		debug(`spawning`, { command, args, options });
		this.childProcess = cp.spawn(command, args, options);

		const exitEvent = new Promise((resolve) =>
			this.childProcess.once("exit", resolve)
		);
		const exitAfterError = new Promise((resolve) =>
			this.childProcess.once("error", (error) => {
				/* istanbul ignore else Difficult to test */
				if (this.childProcess.exitCode != null) {
					this.error = error;
					resolve();
				}
			})
		);

		this.exitPromise = Promise.race([exitEvent, exitAfterError]);
		this.exited = false;
		this.exitPromise.then(() => (this.exited = true));
	}

	async stop(timeoutAfterSignal) {
		await this._killAndWait("SIGTERM", timeoutAfterSignal);
		await this._killAndWait("SIGKILL", timeoutAfterSignal);

		/* istanbul ignore else The else-branch is almost impossible to reach, too difficult to test. */
		if (this.exited) {
			return this.childProcess.exitCode;
		} else {
			throw new Error("Process was not stopped, even after SIGKILL");
		}
	}

	async _killAndWait(signal, timeout) {
		debug("Attempting to stop with signal " + signal);
		this.childProcess.kill(signal);
		const reason = await this._waitForExitWithDelay(timeout);
		debug("Stopped waiting for exit because: ", reason);
	}

	async _waitForExitWithDelay(timeout) {
		return Promise.race([
			this.exitPromise.then(() => "exit"),
			this._delay(timeout).then(() => "timeout"),
		]);
	}

	async _delay(timeout) {
		return new Promise((resolve) => setTimeout(resolve, timeout));
	}
}

module.exports = {
	WatchedChildProcess,
};
