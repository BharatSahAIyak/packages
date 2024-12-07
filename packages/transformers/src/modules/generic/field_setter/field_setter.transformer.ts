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
        const startTime = Date.now();
        console.log("Field Setter called.");
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, startTime);
        if (!this.config.setters) {
            throw new Error('`config.setters` is a required parameter!');
        }
        const xmsgCopy = { ...xmsg };
        const setters: Record<string, string> = this.config.setters;
        let allResolved = true;
        Object.entries(setters).forEach((entry) => {
            try {
                if (entry[1] && typeof entry[1] === 'object') {
                    const resolved = this.resolvePlaceholders(entry[1], xmsg);
                    if (!resolved) {
                        allResolved = false;
                    }
                    set(xmsgCopy, entry[0], entry[1]);
                }
                else {
                    const resolvedValue = this.getResolvedValue(entry[1], xmsg);
                    if (resolvedValue === undefined) {
                        allResolved = false;
                        this.telemetryLogger.sendErrorTelemetry(xmsg, `Failed to resolve value for ${entry[0]}`);
                    }
                    set(xmsgCopy, entry[0], resolvedValue ?? '');
                }
            } catch (error) {
                allResolved = false;
                this.telemetryLogger.sendErrorTelemetry(xmsg, `Error setting field ${entry[0]}: ${error}`);
            }
        });

        if (allResolved) {
            this.telemetryLogger.sendLogTelemetry(xmsg, `All fields resolved and set successfully`, startTime);
        } else {
            this.telemetryLogger.sendLogTelemetry(xmsg, `Some fields failed to resolve`, startTime);
        }
        
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, startTime);
        return xmsgCopy;
    }

    /// Recursively resolves all the placeholders inside a JSON.
    private resolvePlaceholders(jsonValue: Record<string, any>, xmsg: XMessage): boolean {
        let allResolved = true;
        Object.entries(jsonValue).forEach(([key, value]) => {
            try {
                if (value && typeof value === 'object') {
                    const resolved = this.resolvePlaceholders(jsonValue[key], xmsg);
                    if (!resolved) {
                        allResolved = false;
                    }
                }
                else {
                    const resolvedValue = this.getResolvedValue(value, xmsg);
                    if (resolvedValue === undefined) {
                        allResolved = false;
                    }
                    set(jsonValue, key, resolvedValue ?? '');
                }
            } catch (error) {
                allResolved = false;
            }
        });
        return allResolved;
    }

    /// Gets resolved value of a string containing placeholders
    /// by extracting it from XMessage.
    private getResolvedValue(value: string, xmsg: XMessage): string | undefined {
        const xmsgPlaceholder = /\{\{msg:([^}]*)\}\}/g;
        const historyPlaceholder = /\{\{history:([^}]*)\}\}/g;
        const replacements: Record<string, any> = {};
        let matched;
        let hasUnresolvedPlaceholders = false;

        while ((matched = xmsgPlaceholder.exec(value)) !== null) {
            const extracted = get(xmsg, matched[1]);
            if (extracted === undefined) {
                hasUnresolvedPlaceholders = true;
            }
            replacements[matched[0]] = extracted;
        }
        while ((matched = historyPlaceholder.exec(value)) !== null) {
            const extracted = get(xmsg.transformer?.metaData?.userHistory[0] ?? {}, matched[1]);
            if (extracted === undefined) {
                hasUnresolvedPlaceholders = true;
            }
            replacements[matched[0]] = extracted;
        }

        if (hasUnresolvedPlaceholders) {
            return undefined;
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
