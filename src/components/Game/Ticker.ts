const FIXED_INTERVAL = (1000 / 60)

export class Ticker {
    public onLoop: (number: any) => void;
    public onFixedLoop: (number: any) => void;
    private running: boolean = false
    private rafId: number = null;
    private timeoutId: any = null;

    private prevLoopTickDate: number = +new Date();
    private prevFixedLoopTickDate: number = +new Date();

    constructor(onLoop: (number) => void, onFixedLoop: (number) => void) {
        this.onLoop = onLoop
        this.onFixedLoop = onFixedLoop

        this.updateLoop = this.updateLoop.bind(this)
        this.updateFixedLoop = this.updateFixedLoop.bind(this)

        this.updateLoop();
        this.updateFixedLoop();
    }

    start() {
        this.running = true;
    }

    stop() {
        this.running = false;
    }

    private updateLoop() {
        this.rafId = requestAnimationFrame(this.updateLoop)

        let now = +new Date();
        let delta = now - this.prevLoopTickDate
        this.prevLoopTickDate = now

        if (this.running) {
            this.onLoop(delta)
        }
    }

    private updateFixedLoop() {
        let now = +new Date();
        let delta = now - this.prevFixedLoopTickDate
        this.prevFixedLoopTickDate = now

        this.timeoutId = setTimeout(this.updateFixedLoop, FIXED_INTERVAL + Math.max((FIXED_INTERVAL - delta), 0));

        if (this.running) {
            this.onFixedLoop(delta)
        }

    }
}
