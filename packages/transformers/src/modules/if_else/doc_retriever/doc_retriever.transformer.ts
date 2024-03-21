import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import axios from 'axios';
const qs = require('qs');
import { v4 as uuid4 } from 'uuid';

export class DocRetrieverTransformer implements ITransformer {

    /// Accepted config properties:
    ///     url: BFF endpoint used to retrieve docs.
    ///     documentIds: list of documents to search from
    ///     staticNoContentResponse: Bot response message incase no related docs are found, If provided, it'll be attached to the XMessage.payload.text in case no related docs are found. (optional)
    ///     topK: Int describing number of top matched chunks to retrieve. Defaults to 6. (optional)
    ///     searchAll: Boolean Set this to true in order to seach through all docs uploaded via an organization.
    ///     logic: String Type of retrieval logic that needs to be used. Accepted values: "custom" | "topK" (optional). Default: "topK",
    ///     recipeConfig: JSON (optional) Optional JSON configuration for the search recipe. Used for advanced query customization.
    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("DOC_RETRIEVER transformer called.");
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
        
        try {
            let data = qs.stringify({
                'requestId': uuid4(),
                'query': xmsg.payload.text,
                'topK': this.config.topK || '3',
                'searchAll': this.config.searchAll,
                'documentIds': this.config.documentIds,
                'logic': this.config.logic || 'topK',
                'recipeConfig': JSON.stringify(this.config.recipeConfig || {})
            });

            let config = {
                method: 'post',
                maxBodyLength: Infinity,
                url: `${this.config.url}/data/retrieve`,
                headers: { 
                  'orgId': xmsg.orgId, 
                  'ownerId': xmsg.ownerId,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                data : data
            };

            console.log(`retrieving chunks via POST '${`${this.config.url}/data/retrieve`}'`);
            console.log("With config:",config)
            const response = await axios.request(config);
            const responseData = response.data;
            xmsg.transformer.metaData!.retrievedChunks = responseData;
            xmsg.transformer.metaData!.state = (responseData && responseData.length) ? 'if' : 'else';
            if(xmsg.transformer.metaData!.state=='else' && this.config.staticNoContentResponse) {
                xmsg.payload.text = this.config.staticNoContentResponse;
                xmsg.payload.metaData!['staticResponse'] = true;
            }
            return xmsg;
        } catch (ex) {
            console.error(`DOC_RETRIEVER failed. Reason: ${ex}`);
            throw ex;
        }
    }
}
