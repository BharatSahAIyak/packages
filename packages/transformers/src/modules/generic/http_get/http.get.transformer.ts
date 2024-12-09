import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common";
import { Events } from "@samagra-x/uci-side-effects";
import { TelemetryLogger } from "../../common/telemetry";
import get from 'lodash/get';
import { cloneDeep, set } from "lodash";

export class HttpGetTransformer implements ITransformer {

    /// Accepted config properties:
    ///     url: Url of the endpoint. If not provided, `XMessage.transformer.metaData.httpUrl` will be used.
    ///     headers: Headers for request. If not provided, `XMessage.transformer.metaData.httpHeaders` will be used. (optional).
    ///     query: Query string starting with '?' for HTTP request. If not provided, `XMessage.transformer.metaData.httpQuery` will be used. (optional)
    ///     queryJson: Query parameters in JSON format. If not provided, `XMessage.transformer.metaData.httpQueryJson` will be used. Will be ignored if `query` is passed. (optional)
    constructor(readonly config: Record<string, any>) {}
    private readonly telemetryLogger = new TelemetryLogger(this.config);

    async transform(xmsg: XMessage): Promise<XMessage> {
        const startTime = ((performance.timeOrigin + performance.now()) * 1000);
        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: {}
            };
        }
        console.log("HTTP GET transformer called.");

        this.config.url = this.config.url ?? xmsg.transformer?.metaData?.httpUrl;
        this.config.queryJson = this.config.queryJson ?? xmsg.transformer?.metaData?.httpQueryJson ?? {};
        this.config.headers = this.config.headers ?? xmsg.transformer?.metaData?.httpHeaders ?? {};
        this.config.headers = typeof this.config.headers === 'string' ? JSON.parse(this.config.headers || "{}") : this.config.headers ?? {};
        this.config.headers['Content-Type'] = 'application/json';

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

        this.config.headers = httpHeadersCopy;

        if (this.config.queryJson) {
            const httpQueryCopy: Record<string, string> = this.config.queryJson;

            Object.entries(this.config.queryJson as Record<string, any>).forEach((entry) => {
                if (entry[1] && typeof entry[1] === 'object') {
                    this.resolvePlaceholders(entry[1], xmsg);
                    set(httpQueryCopy, entry[0], entry[1]);
                }
                else {
                    set(httpQueryCopy, entry[0], this.getResolvedValue(entry[1], xmsg));
                }
            });

            this.config.queryJson = httpQueryCopy;
        }

        this.config.query = this.config.query ?? xmsg.transformer?.metaData?.httpQuery ?? this.createQueryString(this.config.queryJson);
        this.config.query = this.config.query?.replace(/\\/g, '');

        console.log("query:", `${this.config.url}${this.config.query ?? ''}`)
        console.log("headers", JSON.stringify(this.config.headers))
        if (!this.config.url) {
            this.telemetryLogger.sendErrorTelemetry(xmsg, '`url` not defined in HTTP_GET transformer');
            throw new Error('`url` not defined in HTTP_GET transformer');
        }
        this.config.url = this.processURL(this.config.url, xmsg);
        await fetch(`${this.config.url}${this.config.query ?? ''}`, {
            method: 'GET',
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
                if (!xmsg.transformer) {
                    xmsg.transformer = {
                        metaData: {}
                    };
                }
                xmsg.transformer.metaData!.httpResponse = resp;
            })
            .catch((ex) => {
                this.telemetryLogger.sendErrorTelemetry(xmsg, `GET request failed. Reason: ${ex}`);
                console.error(`GET request failed. Reason: ${ex}`);
                throw ex;
            });
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, startTime);
        return xmsg;
    }

    private createQueryString(queryJson: Record<string, string>): string {
        if (Object.keys(queryJson).length === 0) {
            return '';
        }
        const queryString = Object.entries(queryJson)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        return `?${queryString}`;
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

    private processURL(url: string, xmsg: XMessage) {
        return url.split('/').map((part: string) => {
            const msgPlaceholderRegex = /\{\{\s*msg:([^}]+)\s*\}\}/;
            const match = msgPlaceholderRegex.exec(part);
            if (match) {
                const path = match[0];
                part = part.replace(msgPlaceholderRegex, this.getResolvedValue(path, xmsg));
                console.log(part)
            }
            return part;
        }).join('/')
    }
}
