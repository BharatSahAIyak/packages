import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import { HttpPostTransformer } from "../../generic";
import { Events } from "@samagra-x/uci-side-effects";

export class LabelClassifierTransformer implements ITransformer{

    readonly config: Record<string, any>;

    /// Accepted config properties:
    ///     url: string:  Url of the endpoint
    ///     prompt: string: The prompt to classify. Required if `XMessage.payload.text` is undefined. The `XMessage.payload.text` takes precedence over `prompt` if provided.
    ///     headers: JSON: Headers for request (optional)
    ///     suppressedLabels: string[]: The labels that should be suppressed unless they pass a threshold value (optional).
    ///     existingLabel: If provided, this label would always be returned regardless of highest score, unless another label passes supersedeThreshold. (optional)
    ///     suppressionThreshold: number: The threshold value on and above which no labels will be suppressed. 0.95 by default. (optional)
    ///     supersedeThreshold: number: The threshold value on and above which, a label may supersede an `existingLabel`. 0.95 by default. (optional)
    ///     persistLabel: Boolean: If `true`, the label will be persisted in the `metaData` of XMessage. Default value if `false`. (optional)
    ///     minimumThreshold: number: If provided, a label must reach this threshold score to be considered for final result. Default is 0. (optional)
    ///
    ///     Note: `existingLabel` can also be passed in XMessage `metaData.existingLabel`.
    constructor(config: Record<string, any>) {
        this.config = config;
    }

    async transform(xmsg: XMessage): Promise<XMessage> {
        const startTime = Date.now();
        this.sendLogTelemetry(xmsg, `LABEL_CLASSIFIER : ${this.config.transformerId} started`, startTime);
        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: {}
            };
        }
        const httpTransformer = new HttpPostTransformer({
            url: this.config.url,
            headers: this.config.headers,
            body: {
                text: xmsg.payload?.text ?? this.config.prompt,
            },
            eventBus: this.config.eventBus,
            transformerId: `INTERNAL_HTTP_POST_${this.config.transformerId}`,
        });
        await httpTransformer.transform(xmsg)
        .then((resp) => {
            this.config.supersedeThreshold = this.config.supersedeThreshold ?? 0.95;
            this.config.suppressionThreshold = this.config.suppressionThreshold ?? 0.95;
            this.config.minimumThreshold = this.config.minimumThreshold ?? 0;
            this.config.persistLabel = this.config.persistLabel ?? false;
            this.config.suppressedLabels = this.config.suppressedLabels ?? [];
            let outputState;
            let result: {
                label: string,
                score: string,
            }[] = resp.transformer!.metaData!.httpResponse[0];
            result = result.filter(
                (val) =>
                !((this.config.suppressedLabels.includes(val.label) && (val.score < this.config.suppressionThreshold)) ||
                val.score < this.config.minimumThreshold)
            );
            if (result.length != 0) {
                if (this.config.existingLabel || xmsg.transformer!.metaData!.existingLabel) {
                    if (result[0].score >= this.config.supersedeThreshold) {
                        outputState = result[0].label;
                    }
                    else {
                        outputState = this.config.existingLabel || xmsg.transformer!.metaData!.existingLabel;
                    }
                }
                else {
                    outputState = result[0].label;
                }
            }
            if (outputState != undefined) {
                xmsg.transformer!.metaData!.state = outputState;
            }
            else {
                xmsg.transformer!.metaData!.state = 'STATE_NOT_AVAILABLE';
            }
            if (this.config.persistLabel) {
                xmsg.transformer!.metaData!.existingLabel = xmsg.transformer!.metaData!.state;
            }
            this.sendLogTelemetry(xmsg, `LABEL_CLASSIFIER generated state: ${xmsg.transformer!.metaData!.state}`, startTime);
            console.log(`LABEL_CLASSIFIER generated state: ${xmsg.transformer!.metaData!.state}`);
        })
        .catch((err) => {
            this.sendErrorTelemetry(xmsg, `LabelClassifier failed with error: ${err}`);
            console.error(`LabelClassifier failed with error: ${err}`);
            throw err;
        });
        return xmsg;
    }

    private async sendErrorTelemetry(xmsg: XMessage, error: string) {
        const xmgCopy = {...xmsg};
        xmgCopy.transformer!.metaData!.errorString = error;
        this.config.eventBus.pushEvent({
          eventName: Events.CUSTOM_TELEMETRY_EVENT_ERROR,
          transformerId: this.config.transformerId,
          eventData: xmgCopy,
          timestamp: Date.now(),
        })
    }

    private async sendLogTelemetry(xmsg: XMessage, log: string, startTime: number) {
        const xmgCopy = {...xmsg};
        xmgCopy.transformer!.metaData!.telemetryLog = log;
        xmgCopy.transformer!.metaData!.stateExecutionTime = Date.now() - startTime;
        this.config.eventBus.pushEvent({
          eventName: Events.CUSTOM_TELEMETRY_EVENT_LOG,
          transformerId: this.config.transformerId,
          eventData: xmgCopy,
          timestamp: Date.now(),
        })
    }
}