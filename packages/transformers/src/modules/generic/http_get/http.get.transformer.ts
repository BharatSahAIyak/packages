import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common";

export class HttpGetTransformer implements ITransformer {

    /// Accepted config properties:
    ///     url: Url of the endpoint. If not provided, `XMessage.transformer.metaData.httpUrl` will be used.
    ///     headers: Headers for request. If not provided, `XMessage.transformer.metaData.httpHeaders` will be used. (optional).
    ///     query: Query string starting with '?' for HTTP request. If not provided, `XMessage.transformer.metaData.httpQuery` will be used. (optional)
    ///     queryJson: Query parameters in JSON format. If not provided, `XMessage.transformer.metaData.httpQueryJson` will be used. Will be ignored if `query` is passed. (optional)
    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: {}
            };
        }
        console.log("HTTP GET transformer called.");

        this.config.url = this.config.url ?? xmsg.transformer?.metaData?.httpUrl;
        this.config.queryJson = this.config.queryJson ?? xmsg.transformer?.metaData?.httpQueryJson ?? {};
        this.config.headers = this.config.headers ?? xmsg.transformer?.metaData?.httpHeaders;
        this.config.query = this.config.query ?? xmsg.transformer?.metaData?.httpQuery ?? this.createQueryString(this.config.queryJson);

        if (!this.config.url) {
            throw new Error('`url` not defined in HTTP_GET transformer');
        }
        await fetch(`${this.config.url}${this.config.query ?? ''}`, {
            method: 'GET',
            headers: new Headers(JSON.parse(JSON.stringify(this.config.headers ?? {}))),
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

    private createQueryString(queryJson: Record<string, string>): string {
        if (Object.keys(queryJson).length === 0) {
            return '';
        }
        const queryString = Object.entries(queryJson)
            .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
            .join('&');

        return `?${queryString}`;
    }
}
