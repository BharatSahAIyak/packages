import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common";

export class HttpGetTransformer implements ITransformer {

    /// Accepted config properties:
    ///     headers: Headers for request (optional)
    ///     query: Query string starting with '?' for HTTP request (optional)
    ///     url: Url of the endpoint
    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: {}
            };
        }
        console.log("HTTP GET transformer used with: " + JSON.stringify(xmsg));
        if (!this.config.url) {
            throw new Error('`url` not defined in HTTP_GET transformer');
        }
        await fetch(`${this.config.url}${this.config.query ?? ''}`, {
            method: 'GET',
            headers: new Headers(JSON.parse(JSON.stringify(this.config.headers ?? {}))),
        })
        .then((resp => {
            if (!resp.ok) {
                throw new Error(`Request failed with code: ${resp.status}`);
            }
            else {
                return resp.json();
            }
        }))
        .then((resp) =>{
            if (!xmsg.transformer) {
                xmsg.transformer = {
                    metaData: {}
                };
            }
            xmsg.transformer.metaData!.httpResponse = resp;
        })
        .catch((ex) => {
            console.error(`GET request failed. Reason: ${ex}`);
            throw ex;
        });
        return xmsg;
    }
}
