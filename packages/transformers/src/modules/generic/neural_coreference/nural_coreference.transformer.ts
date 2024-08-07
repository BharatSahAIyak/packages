import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import OpenAI from 'openai';
import { Events } from "@samagra-x/uci-side-effects";
import { TelemetryLogger } from "../../common/telemetry";

export class NeuralCoreferenceTransformer implements ITransformer {

    /// Accepted config properties:
    ///     prompt: GPT prompt used to get coreferenced output.
    ///     APIKey: openAI API key.
    constructor(readonly config: Record<string, any>) { }
    private readonly telemetryLogger = new TelemetryLogger(this.config);

    async transform(xmsg: XMessage): Promise<XMessage> {
        const startTime = Date.now();
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, startTime);
        console.log("NEURAL_COREFERENCE transformer called.");
        if (!xmsg.transformer?.metaData?.userHistory || !xmsg.transformer?.metaData?.userHistory?.length) {
            this.telemetryLogger.sendErrorTelemetry(xmsg, "UserHistory not found! Returning original XMessage in NEURAL_COREFERENCE transformer");
            console.log("UserHistory not found! Returning original XMessage in NEURAL_COREFERENCE transformer")
            return xmsg
        };
        if (!this.config.prompt) {
            this.telemetryLogger.sendErrorTelemetry(xmsg, '`prompt` not defined in NEURAL_COREFERENCE transformer');
            throw new Error('`prompt` not defined in NEURAL_COREFERENCE transformer');
        }
        if (!this.config.APIKey) {
            this.telemetryLogger.sendErrorTelemetry(xmsg, '`APIKey` not defined in NEURAL_COREFERENCE transformer');
            throw new Error('`APIKey` not defined in NEURAL_COREFERENCE transformer');
        }
        this.config.prompt = [{
            role: "user",
            content: this.config.prompt
            .replace('{{user_history}}',`${xmsg.transformer?.metaData?.userHistory.map((message: any)=>message.from == 'admin' ? `AI:${message.payload.text}`: `USER:${message.payload.text}`).join("\n")}`)
            .replace('{{user_question}}',xmsg.payload.text)
        }];
        const openai = new OpenAI({apiKey: this.config.APIKey});
        const response: any = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: this.config.prompt
        }).catch((ex) => {
            this.telemetryLogger.sendErrorTelemetry(xmsg, `NEURAL_COREFERENCE failed. Reason: ${ex}`);
            console.error(`NEURAL_COREFERENCE failed. Reason: ${ex}`);
            throw ex;
        });
        let userArray = response["choices"][0].message.content?.split('User: ');
        xmsg.payload.text = userArray[userArray.length - 1];
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, startTime);
        return xmsg;
    }

}
