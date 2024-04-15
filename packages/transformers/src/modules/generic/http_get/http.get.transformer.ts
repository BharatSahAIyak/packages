import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common";
import { Events } from "@samagra-x/uci-side-effects";

export class HttpGetTransformer implements ITransformer {

    /// Accepted config properties:
    ///     url: Url of the endpoint. If not provided, `XMessage.transformer.metaData.httpUrl` will be used.
    ///     headers: Headers for request. If not provided, `XMessage.transformer.metaData.httpHeaders` will be used. (optional).
    ///     query: Query string starting with '?' for HTTP request. If not provided, `XMessage.transformer.metaData.httpQuery` will be used. (optional)
    ///     queryJson: Query parameters in JSON format. If not provided, `XMessage.transformer.metaData.httpQueryJson` will be used. Will be ignored if `query` is passed. (optional)
    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        const startTime = Date.now();
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
        this.config.query = this.config.query ?? xmsg.transformer?.metaData?.httpQuery ?? this.createQueryString(this.config.queryJson);
        this.config.query = this.config.query?.replace(/\\/g, '');

        console.log("query:", `${this.config.url}${this.config.query ?? ''}`)
        console.log("headers", JSON.stringify(this.config.headers))
        if (!this.config.url) {
            this.sendErrorTelemetry(xmsg, '`url` not defined in HTTP_GET transformer');
            throw new Error('`url` not defined in HTTP_GET transformer');
        }
        await fetch(`${this.config.url}${this.config.query ?? ''}`, {
            method: 'GET',
            headers: new Headers(this.config.headers),
        })
        .then(resp => {
            if (!resp.ok) {
                this.sendErrorTelemetry(xmsg, `Request failed with code: ${resp.status}`);
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
        .then((resp) =>{
            if (!xmsg.transformer) {
                xmsg.transformer = {
                    metaData: {}
                };
            }
            xmsg.transformer.metaData!.httpResponse = resp;
        })
        .catch((ex) => {
            this.sendErrorTelemetry(xmsg, `GET request failed. Reason: ${ex}`);
            console.error(`GET request failed. Reason: ${ex}`);
            throw ex;
        });
        this.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, startTime);
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
