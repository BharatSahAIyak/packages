import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import axios, { AxiosRequestConfig } from 'axios';

export class DocRetrieverTransformer implements ITransformer {

    /// Accepted config properties:
    ///     url: BFF endpoint used to retrieve docs.
    ///     documentIds: list of documents to search from
    ///     staticNoContentResponse: Bot response message incase no related docs are found, If provided, it'll be attached to the XMessage.payload.text in case no related docs are found. (optional)
    ///     topK: Int describing number of top matched chunks to retrieve. Defaults to 6. (optional)
    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("DOC_RETRIEVER transformer used with: " + JSON.stringify(xmsg));
        if (!xmsg.transformer) {
            xmsg.transformer = {
                metaData: {}
            };
        }
        if (!this.config.url) {
            throw new Error('`url` not defined in DOC_RETRIEVER transformer');
        }
        if (!this.config.topK) {
            this.config.topK = 6;
        }
        let pdfIds = this.config.documentIds && this.config.documentIds.length ? `[${this.config.documentIds.filter((id: string)=>id).map((id:string)=>`"${id}"`).join(',')}]` : null;
        try {
            const config: AxiosRequestConfig = {
              headers: {
                'Content-Type': 'application/json'
              }
            };
            console.log(`retrieving chunks via '${`${this.config.url}/chunk/retrieve?text=${xmsg.payload.text}${pdfIds?`&pdfId=${pdfIds}`:''}${this.config.topK ? `&topK=${this.config.topK}`:''}`}'`)
            const response = await axios.get(`${this.config.url}/chunk/retrieve?text=${xmsg.payload.text}${pdfIds?`&pdfId=${pdfIds}`:''}${this.config.topK ? `&topK=${this.config.topK}`:''}`, config);
            const responseData = response.data;
            xmsg.transformer.metaData!.retrievedChunks = responseData;
            xmsg.transformer.metaData!.state = (responseData && responseData.length) ? 'if' : 'else';
            if(xmsg.transformer.metaData!.state=='else' && this.config.staticNoContentResponse) {
                xmsg.payload.text = this.config.staticNoContentResponse;
                xmsg.payload.metaData = JSON.stringify({
                    ...JSON.parse(xmsg.payload.metaData!),
                    staticResponse: true
                });
            }
            return xmsg;
        } catch (ex) {
            console.error(`DOC_RETRIEVER failed. Reason: ${ex}`);
            throw ex;
        }
    }
}
