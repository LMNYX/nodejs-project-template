class TaskResult {
    constructor(...args)
    {
        this._args = args;
    }
    get args() { return this._args; };
}

export class Success extends TaskResult { }
export class Failure extends TaskResult { }
export class Abort extends TaskResult { }
export class Retry extends TaskResult { }
export class RetryOnce extends TaskResult { }
export class SelfDestruct extends TaskResult { }