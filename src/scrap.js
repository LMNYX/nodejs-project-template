import Output from 'utilities/output';
import Worker from 'worker/worker';
import WorkerTask from 'worker/workertasks';
import * as TaskTypes from 'worker/tasktypes';
import { WebSocketClient } from './wsc/wsc';

const WorkerID = 1; // ?Temporary
Output.Log("Starting the client...");

const wsc = new WebSocketClient();
const worker = new Worker(`worker::${WorkerID}`, {
    headless: true
});