import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";

export class ScheduleTransformer implements ITransformer {

    /// Accepted config properties:
    ///     timerDuration: number: (required) Specifies the duration of the timer in milliseconds. This value is mandatory and 
    ///         determines how long the timer will run before it triggers the next action.
    ///     immediateRestore: boolean: (optional, default: false) A flag indicating whether the state should be restored 
    ///         immediately after clearing an existing timer. If set to `true`, the transformer's state is reset to the state
    ///         stored in `metaData.restoreState` after clearing the timer. 
    
    private timers: Map<string, NodeJS.Timeout> = new Map();

    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log(`SCHEDULE_TRANSFORMER called.`);

        if (!this.config.timerDuration) {
            throw new Error('timerDuration is required!');
        }

        const timerId = `${xmsg.from.userID}_timer`;

        if (this.timers.has(timerId)) {
            const timer = this.timers.get(timerId);

            if (timer) {
                clearTimeout(timer);
                this.timers.delete(timerId);
                console.log(`Timer for ${timerId} cleared.`);

                if (this.config.immediateRestore) {
                    xmsg.transformer!.metaData!.state = xmsg.transformer!.metaData!.restoreState;
                }
            }
        }

        const newTimer = setTimeout(() => {
            this.onTimerComplete(xmsg);
        }, this.config.timerDuration);

        this.timers.set(timerId, newTimer);

        return xmsg;
    }

    private onTimerComplete(xmsg: XMessage) {
        console.log(`Timer for ${xmsg.from.userID} completed.`);
        return xmsg;
    }
}
