import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import get from 'lodash/get';
import set from 'lodash/set';
import { TelemetryLogger } from "../../common/telemetry";

export class FieldSetterTransformer implements ITransformer {

    /// Accepted parameters:
    /// setters: Record<string, string> : This defines the fields that need to be set,
    ///          where the `key` is the parameter which needs to be set in `XMessage`
    ///          and `value` is the parameter in `XMessage` which should be used as value.
    ///          If `value` is a normal string or JSON, the value will be used directly, if
    ///          the value is enclosed in {{}} like {{xmsg:payload.text}} or {{history:payload.text}},
    ///          it will be extracted from `XMessage` or from the most recent history message.
    ///          You can also use placeholders {{}} inside a JSON value.
    constructor(
        readonly config: Record<string, any>,
    ) { }

    private readonly telemetryLogger = new TelemetryLogger(this.config);

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("Field Setter called.");
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, Date.now());
        if (!this.config.setters) {
            throw new Error('`config.setters` is a required parameter!');
        }
        const xmsgCopy = { ...xmsg };
        const setters: Record<string, string> = this.config.setters;
        Object.entries(setters).forEach((entry) => {
            if (entry[1] && typeof entry[1] === 'object') {
                this.resolvePlaceholders(entry[1], xmsg);
                set(xmsgCopy, entry[0], entry[1]);
            }
            else {
                set(xmsgCopy, entry[0], this.getResolvedValue(entry[1], xmsg));
            }
        });
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, Date.now());
        return xmsgCopy;
    }

    /// Recursively resolves all the placeholders inside a JSON.
    private resolvePlaceholders(jsonValue: Record<string, any>, xmsg: XMessage) {
        Object.entries(jsonValue).forEach(([key, value]) => {
            if (value && typeof value === 'object') {
                this.resolvePlaceholders(jsonValue[key], xmsg);
            }
            else {
                set(jsonValue, key, this.getResolvedValue(value, xmsg));
            }
        });
    }

    /// Gets resolved value of a string containing placeholders
    /// by extracting it from XMessage.
    private getResolvedValue(value: string, xmsg: XMessage): string {
        const xmsgPlaceholder = /\{\{msg:([^}]*)\}\}/g;
        const historyPlaceholder = /\{\{history:([^}]*)\}\}/g;
        const replacements: Record<string, any> = {};
        let matched;
        while ((matched = xmsgPlaceholder.exec(value)) !== null) {
            replacements[matched[0]] = get(xmsg, matched[1]);
        }
        while ((matched = historyPlaceholder.exec(value)) !== null) {
            replacements[matched[0]] = get(xmsg.transformer?.metaData?.userHistory[0] ?? {}, matched[1]);
        }
        Object.entries(replacements).forEach((replacement) => {
            value = value.replaceAll(
                replacement[0],
                replacement[1] ?
                typeof replacement[1] == 'object' ?
                JSON.stringify(replacement[1]) : replacement[1]
                : ''
            );
        });
        return value;
    }
}
