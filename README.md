# child-service 

[![NPM version](https://img.shields.io/npm/v/child-service.svg)](https://npmjs.com/package/child-service)

> Run and monitor child-processes


# Installation

```
npm install child-service
```

# Usage

Let's assume, we have a service that we we


```js
const ChildService = require("../");
const got = require("got");

const childService = new ChildService({
	command: process.argv0,
	args: ["service.js"],
	readyRegex: /Listening on port 3000/,
	spawnOptions: {
		cwd: __dirname,
	},
});

(async function () {
	await childService.start();
	console.log("Started!")

	const response = await got("http://127.0.0.1:3000")
	console.log(response.body)

	await childService.stop();
	console.log("Stopped!");
})();
```

This will generate the following output

```
Started!
hello

Stopped!
```

# API reference

<a name="ChildService"></a>

## ChildService
The class for starting and stopping services.

**Kind**: global class  
**Access**: public  

* [ChildService](#ChildService)
    * [new ChildService(userOptions)](#new_ChildService_new)
    * [.start()](#ChildService+start) ⇒ <code>Promise.&lt;void&gt;</code>
    * [.stop()](#ChildService+stop) ⇒ <code>Promise.&lt;void&gt;</code>

<a name="new_ChildService_new"></a>

### new ChildService(userOptions)
Create a new child-service


| Param | Type | Description |
| --- | --- | --- |
| userOptions | <code>object</code> | parameters |
| userOptions.command | <code>string</code> | the command to execute |
| userOptions.args | <code>Array.&lt;string&gt;</code> | arguments to the command |
| userOptions.readyRegex | <code>RegExp</code> | process is assumed to be ready, when this regex matches the output. |
| userOptions.outputLimit | <code>number</code> | only look for readyRegex in the first "outputLimit" number of bytes of the output. |
| userOptions.spawnOptions | <code>object</code> | options to pass to child_process.spawn |

<a name="ChildService+start"></a>

### childService.start() ⇒ <code>Promise.&lt;void&gt;</code>
Starts the service.

**Kind**: instance method of [<code>ChildService</code>](#ChildService)  
**Returns**: <code>Promise.&lt;void&gt;</code> - resolves when the "readyRegex" has been found.  
<a name="ChildService+stop"></a>

### childService.stop() ⇒ <code>Promise.&lt;void&gt;</code>
Stop the service.

**Kind**: instance method of [<code>ChildService</code>](#ChildService)  
**Returns**: <code>Promise.&lt;void&gt;</code> - resolves, when the executable has exited.  



# License

`child-service` is published under the MIT-license.

See [LICENSE.md](LICENSE.md) for details.


 
# Contributing guidelines

See [CONTRIBUTING.md](CONTRIBUTING.md).