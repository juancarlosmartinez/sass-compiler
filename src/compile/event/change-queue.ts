import {ChangeEvent} from "./change-event";
import {setInterval} from "node:timers";

export class ChangeQueue {
    /* STATIC */

    /* INSTANCE */
    private readonly queue: ChangeEvent[] = [];
    private processing: boolean = false;
    private interval: NodeJS.Timeout|null = null;
    public constructor() {
        this.start();
    }

    private start(): void {
        this.interval = setInterval(() => {
            console.log(`Processing change event queue, remaining events:, ${{ length: this.queue.length, processing: this.processing }}`);
            if (!this.processing && this.queue.length > 0) {
                this.processing = true;
                const event = this.queue.shift()!;
                event.process()
                    .then(() => {})
                    .catch(() => {})
                    .finally(() => {
                        this.processing = false;
                    })
                ;
            }
        }, 100);
    }

    public push(event: ChangeEvent): void {
        this.queue.push(event);
    }

    public stop(): void {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
}