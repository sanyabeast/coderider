const FIXED_INTERVAL = (1000 / 60)

export class Ticker {
    public onLoop: (delta: number, factor: number) => void;
    public onFixedLoop: (delta: number, factor: number) => void;
    private running: boolean = false
    private rafId: number = null;
    private timeoutId: any = null;

    private prevLoopTickDate: number = +new Date();
    private prevFixedLoopTickDate: number = +new Date();
    private documentVisible: boolean;

    constructor(
        onLoop: (delta: number, factor: number) => void,
        onFixedLoop: (delta: number, factor: number) => void
    ) {
        this.onLoop = onLoop
        this.onFixedLoop = onFixedLoop

        this.updateLoop = this.updateLoop.bind(this)
        this.updateFixedLoop = this.updateFixedLoop.bind(this)

        this.documentVisible = document.visibilityState === 'visible'

        if (this.documentVisible) {
            this.enableLoops()
        }

        document.addEventListener("visibilitychange", () => {
            this.documentVisible = document.visibilityState === "visible"

            if (this.documentVisible) {
                this.enableLoops()
            } else {
                this.disableLoops()
            }
        })
    }

    private enableLoops() {
        this.prevLoopTickDate = +new Date()
        this.prevFixedLoopTickDate = +new Date()
        this.updateLoop();
        this.updateFixedLoop();
    }

    private disableLoops() {
        cancelAnimationFrame(this.rafId)
        clearTimeout(this.timeoutId)
    }

    setRunning(isRunning: boolean) {
        this.running = isRunning;
    }

    private updateLoop() {
        this.rafId = requestAnimationFrame(this.updateLoop)

        let now = +new Date();
        let delta = now - this.prevLoopTickDate
        this.prevLoopTickDate = now

        if (this.running) {
            this.onLoop(delta / 1000, delta / FIXED_INTERVAL)
        }
    }

    private updateFixedLoop() {
        let now = +new Date();
        let delta = now - this.prevFixedLoopTickDate
        this.prevFixedLoopTickDate = now

        this.timeoutId = setTimeout(this.updateFixedLoop, FIXED_INTERVAL);

        if (this.running) {
            this.onFixedLoop(delta / 1000, delta / FIXED_INTERVAL)
        }

    }
}
