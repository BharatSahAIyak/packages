import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";

export class HttpPostTransformer implements ITransformer {

    /// Accepted config properties:
    ///     url: Url of the endpoint. If not provided, `XMessage.transformer.metaData.httpUrl` will be used.
    ///     headers: Headers for request. If not provided, `XMessage.transformer.metaData.httpHeaders` will be used. (optional).
    ///     body: Body for the HTTP POST request. If not provided, `XMessage.transformer.metaData.httpBody` will be used. (optional)
    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("HTTP POST transformer called.");

        this.config.url = this.config.url ?? xmsg.transformer?.metaData?.httpUrl;
        this.config.headers = this.config.headers ?? xmsg.transformer?.metaData?.httpHeaders ?? {};
        this.config.headers['Content-Type'] = 'application/json';
        this.config.body = this.config.body ?? xmsg.transformer?.metaData?.httpBody ?? {};

        if (!this.config.url) {
            throw new Error('`url` not defined in HTTP_POST transformer');
        }
        await fetch(this.config.url, {
            method: 'POST',
            body: typeof this.config.body === 'string' ? this.config.body : JSON.stringify(this.config.body ?? {}),
            headers: new Headers(JSON.parse(JSON.stringify(this.config.headers))),
        })
        .then(resp => {
            if (!resp.ok) {
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
            console.error(`POST request failed. Reason: ${ex}`);
            throw ex;
        });
        return xmsg;
    }
}
