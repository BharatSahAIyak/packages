import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
const config = require('./config.json');
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
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, Math.floor((performance.timeOrigin + performance.now()) * 1000), config['eventId']);

        if (!this.config.restoreState) {
            this.telemetryLogger.sendErrorTelemetry(xmsg, 'restoreState is required!');
            throw new Error('restoreState is required!');
        }

        if (!this.config.timerDuration) {
            throw new Error('timerDuration is required!');
        }

        const timerId = `timer_${xmsg.from.userID}_${xmsg.channelURI}_${xmsg.providerURI}_${this.config.transformerId}`;

        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: {}
            };
        }

        xmsg.transformer!.metaData!.timerId = timerId;
        xmsg.transformer!.metaData!.timerDuration = this.config.timerDuration;
        /** Ideal way to do this is commented below */
        // xmsg.transformer!.metaData!.restoreState = this.config.restoreState;
        // xmsg.transformer!.metaData!.resetState = this.config.resetState;

        /** We are doing things the following way for the sake of backwards compatibility
         * The transformer states will not be updated from the config
         */
        xmsg.transformer!.metaData!.restoreState = this.config.resetState ;
        xmsg.transformer!.metaData!.resetState = this.config.restoreState ;


        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, Math.floor((performance.timeOrigin + performance.now()) * 1000), config['eventId']);
        return xmsg;
    }
}
