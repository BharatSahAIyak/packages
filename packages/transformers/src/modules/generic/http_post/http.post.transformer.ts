import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import { Events } from "@samagra-x/uci-side-effects";
import { TelemetryLogger } from "../../common/telemetry";
import get from 'lodash/get';
import { cloneDeep, set } from "lodash";

export class HttpPostTransformer implements ITransformer {

    /// Accepted config properties:
    ///     url: Url of the endpoint. If not provided, `XMessage.transformer.metaData.httpUrl` will be used.
    ///     headers: Headers for request. If not provided, `XMessage.transformer.metaData.httpHeaders` will be used. (optional).
    ///     body: Body for the HTTP POST request. If not provided, `XMessage.transformer.metaData.httpBody` will be used. (optional)
    constructor(readonly config: Record<string, any>) {}
    private readonly telemetryLogger = new TelemetryLogger(this.config);

    async transform(xmsg: XMessage): Promise<XMessage> {
        const startTime = Date.now();
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, startTime);
        console.log("HTTP POST transformer called.");

        this.config.url = this.config.url ?? xmsg.transformer?.metaData?.httpUrl;
        this.config.headers = this.config.headers ?? xmsg.transformer?.metaData?.httpHeaders ?? {};
        this.config.headers = typeof this.config.headers === 'string' ? JSON.parse(this.config.headers || "{}") : this.config.headers ?? {};
        this.config.headers['Content-Type'] = 'application/json';
        console.log("==== BEFORE =====")
        console.log(JSON.stringify(this.config.headers, null, 2))
        console.log("==== BEFORE END=====")


        const httpHeadersCopy: Record<string, string> = cloneDeep(this.config.headers);

        Object.entries(this.config.headers as Record<string, any>).forEach((entry) => {
            if (entry[1] && typeof entry[1] === 'object') {
                this.resolvePlaceholders(entry[1], xmsg);
                set(httpHeadersCopy, entry[0], entry[1]);
            }
            else {
                set(httpHeadersCopy, entry[0], this.getResolvedValue(entry[1], xmsg));
            }
        });
        console.log("==== AFTER =====")

        this.config.headers = httpHeadersCopy;

        console.log("==== AFTER END =====")

        console.log(JSON.stringify(this.config.headers, null, 2))

        this.config.body = this.config.body ?? xmsg.transformer?.metaData?.httpBody ?? {};
        const httpBodyCopy: Record<string, string> = cloneDeep(this.config.body);

        Object.entries(this.config.body as Record<string, any>).forEach((entry) => {
            if (entry[1] && typeof entry[1] === 'object') {
                this.resolvePlaceholders(entry[1], xmsg);
                set(httpBodyCopy, entry[0], entry[1]);
            }
            else {
                set(httpBodyCopy, entry[0], this.getResolvedValue(entry[1], xmsg));
            }
        });

        this.config.body = httpBodyCopy;


        console.log("HTTP POST url-", this.config.url)
        console.log("HTTP POST body -", typeof this.config.body === 'string' ? this.config.body : JSON.stringify(this.config.body ?? {}));
        console.log("HTTP POST headers -", new Headers(this.config.headers))

        if (!this.config.url) {
            this.telemetryLogger.sendErrorTelemetry(xmsg, '`url` not defined in HTTP_POST transformer');
            throw new Error('`url` not defined in HTTP_POST transformer');
        }
        await fetch(this.config.url, {
            method: 'POST',
            body: typeof this.config.body === 'string' ? this.config.body : JSON.stringify(this.config.body ?? {}),
            headers: new Headers(this.config.headers),
        })
            .then(resp => {
                if (!resp.ok) {
                    this.telemetryLogger.sendErrorTelemetry(xmsg, `Request failed with code: ${resp.status}`);
                    throw new Error(`Request failed with code: ${resp.status}`);
                } else {
                    const contentType = resp.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        return resp.json();
                    } else {
                        return resp.text();
                    }
                }
            })
            .then((resp) => {
                console.log('resp', resp)
                if (!xmsg.transformer) {
                    xmsg.transformer = {
                        metaData: {}
                    };
                }
                xmsg.transformer.metaData!.httpResponse = resp;
            })
            .catch((ex) => {
                this.telemetryLogger.sendErrorTelemetry(xmsg, `POST request failed. Reason: ${ex}`);
                console.error(`POST request failed. Reason: ${ex}`);
                throw ex;
            });
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, startTime);
        return xmsg;
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
