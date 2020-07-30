declare module "child-service" {
	export class ChildService {
		constructor(userOptions?: ChildServiceOptions);

		start(): Promise<void>;

		stop(): Promise<void>;
	}

	interface ChildServiceOptions {
		command: string | Promise<string>;
		args?: string[] | Promise<string[]>;
		readyRegex?: RegExp;
		outputLimit?: number;
		spawnOptions?: AllowedSpawnOptions;
		timeoutAfterSignal?: number;
		listenOnStderr?: boolean;
	}

	interface AllowedSpawnOptions {
		cwd?: string;
		env?: ProcessEnv;
	}

	// Copied from the node.js type definitions
	interface ProcessEnv extends Dict<string> {}

	// Copied from the node.js type definitions
	interface Dict<T> {
		[key: string]: T | undefined;
	}
}
