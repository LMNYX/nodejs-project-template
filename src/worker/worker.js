import * as puppeteer from 'puppeteer';
import { PresetOutput } from 'utilities/output';
import * as TaskResults from 'worker/taskresults';

export default class Worker
{
    AlreadyRan = false;
    constructor(name, options)
    {
        if (this.AlreadyRan) return;
        this.name = name;
        this.options = options;
        this.tasks = [];
        this.Output = new PresetOutput(this.name);
        this.#Run();
    }

    AddTask(task)
    {
        this.tasks.push(task);
    }

    async #Run()
    {
        this.AlreadyRan = true;
        this.pages = [];
        this.TaskCount = 0;
        this.Output.Log("Starting a worker...");

        this.browser = await puppeteer.launch({
            headless: 'headless' in this.options ? this.options.headless : true
        });
        this.Output.Log("Worker started.");
        this.Output.Log("Waiting for tasks...");

        // Handling of the tasks
        while (true)
        {
            if (this.tasks.length > 0) {
                const task = this.tasks.shift();
                this.Output.Log("Got a task with", task.tasksCount.toString().cyan, "step(s).");
                Promise.all([this.#HandleTask(task, this.TaskCount)]);
                this.TaskCount++;
            }

            // interval
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }
    async #CloseAllPages()
    {
        for (var i = 0; i < this.pages.length; i++) {
            try { this.pages[i]['page'].close(); delete this.pages[i]; } catch (e) {}
        }
    }

    async #HandleTask(task, taskCount, retryCount)
    {
        if (retryCount == undefined) retryCount = 0;
        if (retryCount > 5)
        {
            this.Output.Error("Failed to handle task ", taskCount, " after 5 retries. Skipping...");
            return false;
        }
        try
        {
            const _tasks = task.tasks;
            this.pages.push({"page": await this.browser.newPage(), "stored_vdata": [], "stored_kwdata": {}});
            const page = this.pages[taskCount]['page'];
            for (var currentTask = 0; currentTask < _tasks.length; currentTask++)
            {
                const taskType = _tasks[currentTask].constructor.name;
                this.Output.Log(`${`task${taskCount}`.cyan} ::`, taskType, _tasks[currentTask].args.length > 0 ? ":" : "", _tasks[currentTask].args);

                var taskResult = await this.#HandleTaskType(taskType, _tasks[currentTask], page, taskCount, currentTask);
                switch (taskResult)
                {
                    case TaskResults.Retry:
                        currentTask = -1;
                        break;
                    case TaskResults.RetryOnce:
                        currentTask = -1;
                        _tasks.splice(-1);
                        break;
                }
            }

            switch (taskResult)
            {
                case TaskResults.Success:
                    await page.close();
                    this.Output.Log("Task", taskCount.toString().cyan, "completed.");
                    break;
                case TaskResults.Failure:
                    await page.close();
                    this.Output.Error("Task", taskCount.toString().cyan, "failed.");
                    break;
                case TaskResults.SelfDestruct:
                    this.Output.Warn("Task", taskCount.toString().cyan, "self-destructed.");
                    break;
                case TaskResults.Abort:
                    await page.close();
                    this.Output.Log("Task", taskCount.toString().cyan, "aborted.");
                    break;
                default:
                    this.Output.Error("Task", taskCount, "has unknown result:", taskResult.toString().yellow);
                    break;
            }
            delete this.pages[taskCount];
            return;
        }
        catch (e)
        {
            await page.close();
            this.#HandleTask(task, taskCount, retryCount+1);
        }
    }

    async #HandleTaskType(taskType, task, page, taskCount, crntTask, retryCount, _e)
    {
        if (retryCount == undefined) retryCount = 0;
        if (retryCount > 5)
        {
            this.Output.Error("Task", `${taskCount}::${crntTask}`.yellow, `(${taskType})`.yellow, "failed after", retryCount.toString().yellow, "retries. Exception: ", _e);
            return TaskResults.Failure;
        }
        try
        {
            switch (taskType)
            {
                case "AddToStoredData":
                    this.pages[taskCount]['stored_vdata'].push(...task.args);
                    break;
                case "RemoveFromStoredDataByIndex":
                    if(this.pages[taskCount].indexOf(parseInt(task.args[0])) > -1)
                        this.pages[taskCount]['stored_vdata'].splice(parseInt(task.args[0]), 1);
                    break;
                case "ClearStoredData":
                    this.pages[taskCount]['stored_vdata'] = [];
                    this.pages[taskCount]['stored_kwdata'] = [];
                    break;
                case "IfStoredDataValueAtIndexIsEqualToThenReload":
                    if (this.pages[taskCount]['stored_vdata'][parseInt(task.args[0])] == task.args[1])
                        await page.reload();
                    break;
                case "IfSelectorElementInnerEqualToThenReload":
                    var _el = await page.$(task.args[0]);
                    var _elText = await page.evaluate(el => el.innerHTML, _el);
                    if(_elText == task.args[1])
                        await page.reload();
                    break;
                case "GetSelectorElementAndAddItsAttributeToStoredData":
                    var _el = await page.$(task.args[0]);
                    var _attr = await page.evaluate((el, attr) => el.getAttribute(attr), _el, task.args[1]);
                    this.pages[taskCount]['stored_vdata'].push(_attr);
                    break;
                case "GetSelectorElementAndAddItsAttributeToStoredKeywordData":
                    var _el = await page.$(task.args[0]);
                    var _attr = await page.evaluate((el, attr) => el.getAttribute(attr), _el, task.args[1]);
                    this.pages[taskCount]['stored_kwdata'][task.args[2]] = _attr;
                    break;
                case "WaitForSelectorAndAddItsAttributeToStoredData":
                    _el = await page.waitForSelector(task.args[0]);
                    var _attr = await page.evaluate((el, attr) => el.getAttribute(attr), _el, task.args[1]);
                    this.pages[taskCount]['stored_vdata'].push(_attr);
                    break;
                case "EvaluateAndAddToStoredData":
                    this.pages[taskCount]['stored_vdata'].push(await page.evaluate(task.args[0]));
                    break;
                case "EvaluateAndAddToStoredKeywordData":
                    this.pages[taskCount]['stored_kwdata'][task.args[1]] = await page.evaluate(task.args[0]);
                    break;
                case "WaitForSelectorAndAddItsElementInnerToStoredData":
                    _el = await page.waitForSelector(task.args[0]);
                    var _elText = await page.evaluate(el => el.innerHTML, _el);
                    this.pages[taskCount]['stored_vdata'].push(_elText);
                    break;
                case "GetSelectorElementInnerAndAddToStoredData":
                    var _el = await page.$(task.args[0]);
                    var _elText = await page.evaluate(el => el.innerHTML, _el);
                    this.pages[taskCount]['stored_vdata'].push(_elText);
                    break;
                case "GetSelectorElementInnerAndAddToStoredKeywordData":
                    var _el = await page.$(task.args[0]);
                    var _elText = await page.evaluate(el => el.innerHTML, _el);
                    this.pages[taskCount]['stored_kwdata'][task.args[1]] = _elText;
                    break;
                case "WaitForSelector":
                    await page.waitForSelector(task.args[0]);
                    break;
                case "SetElementValue":
                    var _el = await page.$(task.args[0]);
                    await page.evaluate((el, value) => el.value = value, _el, task.args[1]);
                    break;
                case "ClickSelector":
                    await page.click(task.args[0]);
                    break;
                case "FocusSelector":
                    await page.focus(task.args[0]);
                    break;
                case "KeyboardPress":
                    await page.keyboard.type(task.args[0]);
                    break;
                case "Visit":
                    await page.goto(task.args[0]);
                    break;
                case "WaitUntilLoaded":
                    await page.waitForResponse( response => response.ok() );
                    break;
                case "Sleep":
                    await new Promise(resolve => setTimeout(resolve, parseInt(task.args[0])));
                    break;
                case "DebugLogStoredData":
                    this.Output.Log("Stored vdata:", this.pages[taskCount]['stored_vdata']);
                    this.Output.Log("Stored kwdata:", JSON.stringify(this.pages[taskCount]['stored_kwdata']));
                    break;
                case "SelfDestruct":
                    await page.close();
                    return TaskResults.SelfDestruct;
                case "StartOver":
                    return TaskResults.Retry;
                case "StartOverOnce":
                    return TaskResults.RetryOnce;
                default:
                    this.Output.Warn("Unknown task type: ", taskType, " Skipping...");
                    break;
            }
        }
        catch (e)
        {
            return this.#HandleTaskType(taskType, task, page, taskCount, crntTask, retryCount+1, e);
        }
        return TaskResults.Success;
    }
}