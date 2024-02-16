import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../common/transformer.interface";

export class HttpPostTransformer implements ITransformer {

    /// Accepted config properties:
    ///     headers: Headers for request (optional)
    ///     body: Body for the HTTP POST request (optional)
    ///     url: Url of the endpoint
    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("HTTP POST transformer used with: " + JSON.stringify(xmsg));
        if (!this.config.url) {
            throw new Error('`url` not defined in HTTP_POST transformer');
        }
        await fetch(this.config.url, {
            method: 'POST',
            body: JSON.stringify(this.config.body ?? {}),
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
            console.error(`POST request failed. Reason: ${ex}`);
            throw ex;
        });
        return xmsg;
    }
}
