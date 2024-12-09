import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import { TelemetryLogger } from "../../common/telemetry";

export class ScheduleTransformer implements ITransformer {

    /// Accepted config properties:
    ///     timerDuration: number: (required) Specifies the duration of the timer in milliseconds.
    ///     resetOnReply: boolean: (optional, default: false) If true, restores state immediately after clearing an existing timer.
    ///     resetState: string: (optional) The state to restore when the timer is reset.

    constructor(readonly config: Record<string, any>) {}
    private readonly telemetryLogger = new TelemetryLogger(this.config);

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log(`SCHEDULE_TRANSFORMER called.`);
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, ((performance.timeOrigin + performance.now()) * 1000));

        if (!this.config.timerDuration) {
            throw new Error('timerDuration is required!');
        }

        const timerId = `timer_${xmsg.from.userID}_${xmsg.channelURI}_${xmsg.providerURI}`;
        xmsg.transformer!.metaData!.timerId = timerId;
        xmsg.transformer!.metaData!.timerDuration = this.config.timerDuration;
        xmsg.transformer!.metaData!.restoreState = this.config.restoreState;
        xmsg.transformer!.metaData!.resetState = this.config.resetState;

        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, ((performance.timeOrigin + performance.now()) * 1000));
        return xmsg;
    }
}
