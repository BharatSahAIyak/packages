import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
const config = require('./config.json');
import { Events } from "@samagra-x/uci-side-effects";
import get from 'lodash/get';
import { TelemetryLogger } from "../../common/telemetry";

export class FieldToStateTransformer {

    config: Record<string, any>;
    private readonly telemetryLogger: TelemetryLogger;

    /// Accepted config properties:
    ///     target: string:  flat path to the target field in the transformer, defaults to  `payload.text`
    ///
    constructor(config: Record<string, any>) {
        this.config = config;
        this.telemetryLogger = new TelemetryLogger(this.config);
    }


    async transform(xmsg: XMessage): Promise<XMessage> {
        const startTime = Math.floor((performance.timeOrigin + performance.now()) * 1000);
        this.telemetryLogger.sendLogTelemetry(xmsg, `FIELD STATE TRANSFORMER : ${this.config.transformerId} started`, startTime, config['eventId']);

        if (!this.config.target) {
            this.config.target = 'payload.text';
        }

        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: {}
            };
        }

        let outputState = get(xmsg, this.config.target);
        if (outputState != undefined) {
            xmsg.transformer!.metaData!.state = outputState;
        }
        else {
            xmsg.transformer!.metaData!.state = 'STATE_NOT_AVAILABLE';
        }

        this.telemetryLogger.sendLogTelemetry(xmsg, `FIELD TO STATE Transformer generated state: ${xmsg.transformer!.metaData!.state}`, startTime, config['eventId']);
        console.log(`LABEL_CLASSIFIER generated state: ${xmsg.transformer!.metaData!.state}`);
        return xmsg;
    }
}