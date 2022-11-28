
export default class WorkerTask
{
    constructor(...tasks)
    {
        this._tasks = tasks;
    }
    
    get tasks()
    {
        return this._tasks;
    }
    get tasksCount()
    {
        return this._tasks.length;
    }
}