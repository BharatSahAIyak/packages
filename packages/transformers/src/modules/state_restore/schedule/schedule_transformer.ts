import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";

export class ScheduleTransformer implements ITransformer {

    /// Accepted config properties:
    ///     timerDuration: number: (required) Specifies the duration of the timer in milliseconds.
    ///     resetOnReply: boolean: (optional, default: false) If true, restores state immediately after clearing an existing timer.
    ///     resetState: string: (optional) The state to restore when the timer is reset.
    
    private static timers: Map<string, NodeJS.Timeout> = new Map();

    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log(`SCHEDULE_TRANSFORMER called.`);

        if (!this.config.timerDuration) {
            throw new Error('timerDuration is required!');
        }

        const timerId = `timer_${xmsg.from.userID}_${xmsg.channelURI}_${xmsg.providerURI}`;

        if (ScheduleTransformer.timers.has(timerId)) {
            const timer = ScheduleTransformer.timers.get(timerId);

            if (timer) {
                clearTimeout(timer);
                ScheduleTransformer.timers.delete(timerId);
                console.log(`Timer for ${timerId} cleared.`);

                // Determine the state to restore based on the resetOnReply flag.
                if (this.config.resetOnReply && this.config.resetState) {
                    xmsg.transformer!.metaData!.state = this.config.resetState;
                } else {
                    throw new Error('Reset state not set.');
                }
            }
        }

        const newTimer = setTimeout(() => {
            this.onTimerComplete(xmsg);
        }, this.config.timerDuration);

        ScheduleTransformer.timers.set(timerId, newTimer);

        return xmsg;
    }

    private onTimerComplete(xmsg: XMessage) {
        console.log(`Timer for ${xmsg.from.userID} completed.`);
        // Set the state to the restoreState once the timer completes.
        xmsg.transformer!.metaData!.state = xmsg.transformer!.metaData!.restoreState;
        return xmsg;
    }
}
