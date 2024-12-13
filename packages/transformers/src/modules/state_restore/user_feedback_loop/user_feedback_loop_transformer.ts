import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
const config = require('./config.json');
import { TelemetryLogger } from "../../common/telemetry";

export class UserFeedbackLoopTransformer implements ITransformer {

    /// Accepted config properties:
    ///     prompt: string: A prompt to send the user to reply to. If not provided, default `XMessage.payload` will be used.
    constructor(readonly config: Record<string, any>) {}
    private readonly telemetryLogger = new TelemetryLogger(this.config);

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log(`USER_FEEDBACK_LOOP called.`);
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, ((performance.timeOrigin + performance.now()) * 1000),config['eventId']);
        if (!this.config.restoreState) {
            this.telemetryLogger.sendErrorTelemetry(xmsg, 'restoreState is required!');
            throw new Error('restoreState is required!');
        }
        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: {}
            };
        }
        // `config.restoreState` is an injected value, pulled from state.
        // This value is not supposed to be set externally.
        xmsg.transformer.metaData!.restoreState = this.config.restoreState;
        if (!this.config.prompt) {
            if (!xmsg.payload.text) {
                this.telemetryLogger.sendErrorTelemetry(xmsg, 'prompt or `XMessage.payload.text` is required!');
                throw new Error('prompt or `XMessage.payload.text` is required!')
            }
        }
        xmsg.payload.text = this.config.prompt || xmsg.payload.text;
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, ((performance.timeOrigin + performance.now()) * 1000),config['eventId']);
        return xmsg;
    }
}
