import WebSocket from 'ws';
import 'dotenv/config';

export class WebSocketClient
{
    constructor()
    {
        this.ws = new WebSocket(process.env.WS_MAIN_SERVER);
        this.ws._this = this;
        this.ws.on('open', this.prepare_events);
    }

    prepare_events()
    {
        // this is the WebSocket object
    }
}