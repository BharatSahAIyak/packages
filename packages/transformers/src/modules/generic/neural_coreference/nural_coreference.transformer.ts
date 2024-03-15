import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import OpenAI from 'openai';

export class NeuralCoreferenceTransformer implements ITransformer {

    /// Accepted config properties:
    ///     prompt: GPT prompt used to get coreferenced output.
    ///     openAIAPIKey: openAI API key.
    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("NEURAL_COREFERENCE transformer used with: " + JSON.stringify(xmsg));
        if (!xmsg.transformer?.metaData?.userHistory || !xmsg.transformer?.metaData?.userHistory?.length) {
            console.log("UserHistory not found! Returning original XMessag in NEURAL_COREFERENCE transformer")
            return xmsg
        };
        if (!this.config.prompt) {
            throw new Error('`prompt` not defined in NEURAL_COREFERENCE transformer');
        }
        if (!this.config.openAIAPIKey) {
            throw new Error('`openAIAPIKey` not defined in NEURAL_COREFERENCE transformer');
        }
        this.config.prompt = [{
            role: "user",
            content: this.config.prompt
            .replace('{{user_history}}',`${xmsg.transformer?.metaData?.userHistory.map((message: any)=>message.from == 'admin' ? `AI:${message.payload.text}`: `USER:${message.payload.text}`).join("\n")}`)
            .replace('{{user_question}}',xmsg.payload.text)
        }];
        const openai = new OpenAI({apiKey: this.config.openAIAPIKey});
        const response: any = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: this.config.prompt
        }).catch((ex) => {
            console.error(`NEURAL_COREFERENCE failed. Reason: ${ex}`);
            throw ex;
        });
        let userArray = response["choices"][0].message.content?.split('User: ');
        xmsg.payload.text = userArray[userArray.length - 1];
        return xmsg;
    }
}
