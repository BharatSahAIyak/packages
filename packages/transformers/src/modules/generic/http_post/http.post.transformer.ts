import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import { Events } from "@samagra-x/uci-side-effects";
import { TelemetryLogger } from "../../common/telemetry";

export class HttpPostTransformer implements ITransformer {

    /// Accepted config properties:
    ///     url: Url of the endpoint. If not provided, `XMessage.transformer.metaData.httpUrl` will be used.
    ///     headers: Headers for request. If not provided, `XMessage.transformer.metaData.httpHeaders` will be used. (optional).
    ///     body: Body for the HTTP POST request. If not provided, `XMessage.transformer.metaData.httpBody` will be used. (optional)
    constructor(readonly config: Record<string, any>) { }
    private readonly telemetryLogger = new TelemetryLogger(this.config);

    async transform(xmsg: XMessage): Promise<XMessage> {
        const startTime = Date.now();
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, startTime);
        console.log("HTTP POST transformer called.");

        this.config.url = this.config.url ?? xmsg.transformer?.metaData?.httpUrl;
        this.config.headers = this.config.headers ?? xmsg.transformer?.metaData?.httpHeaders ?? {};
        this.config.headers = typeof this.config.headers === 'string' ? JSON.parse(this.config.headers || "{}") : this.config.headers ?? {};
        this.config.headers['Content-Type'] = 'application/json';
        this.config.body = this.config.body ?? xmsg.transformer?.metaData?.httpBody ?? {};
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
            console.log('resp',resp)
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
}
