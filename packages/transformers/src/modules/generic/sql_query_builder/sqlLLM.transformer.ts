//temporary transformer will be replaces with HTTP and LLM transfomers.
import { XMessage } from "@samagra-x/xmessage";
import OpenAI from 'openai';
import { ITransformer } from "../../common";
import getBhashiniConfig from '../translate/bhashini/bhashini.getConfig';
import computeBhashini from "../translate/bhashini/bhashini.compute";
import { TelemetryLogger } from "../../common/telemetry";
const config = require('./config.json');

export class SQLLLMTransformer implements ITransformer {

    /// Accepted config properties:
    ///     APIKey: openAI API key.
    ///     model: LLM model.
    ///     xlsxIds: list of excel ids to search from.
    ///     outboundURL: Endpoint of service which sends message to end user.
    ///     outputLanguage: stream output language.
    ///     excelParserURL: Base url for excel parser.
    ///     bhashiniUserId: user id for bhashini (required if provider is set to bhashini)
    ///     bhashiniAPIKey: API key for bhashini (required if provider is set to bhashini)
    ///     bhashiniURL: Base url for bhashini (required if provider is set to bhashini)
    ///     prompt: LLM prompt. (optional)
    ///     temperature: The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. (default: `0`)
    constructor(readonly config: Record<string, any>) {}
    private readonly telemetryLogger = new TelemetryLogger(this.config);

    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("SQLLLMTransformer transformer called.");
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, ((performance.timeOrigin + performance.now()) * 1000), config['eventId']);
        if (!xmsg.transformer?.metaData?.userHistory || !xmsg.transformer?.metaData?.userHistory?.length){
            xmsg.transformer = {
                ...xmsg.transformer,
                metaData: {
                    ...xmsg.transformer?.metaData,
                    userHistory: []
                }
            };
        }
        if (!this.config.model) {
            this.telemetryLogger.sendErrorTelemetry(xmsg, '`model` not defined in SQLLLM transformer');
            throw new Error('`model` not defined in SQLLLM transformer');
        }
        if (!this.config.APIKey) {
            this.telemetryLogger.sendErrorTelemetry(xmsg, '`APIKey` not defined in SQLLLM transformer');
            throw new Error('`APIKey` not defined in SQLLLM transformer');
        }
        if (!this.config.temperature) {
            this.config.temperature = 0;
        }
        if (!this.config.outputLanguage) {
            this.config.outputLanguage = 'en';
        }
        if (this.config.outputLanguage != 'en') {
            if (!this.config.bhashiniUserId) {
                this.telemetryLogger.sendErrorTelemetry(xmsg, '`bhashiniUserId` not defined in SQLLLM transformer');
                throw new Error('`bhashiniUserId` not defined in SQLLLM transformer');
            }
            if (!this.config.bhashiniAPIKey) {
                this.telemetryLogger.sendErrorTelemetry(xmsg, '`bhashiniAPIKey` not defined in SQLLLM transformer');
                throw new Error('`bhashiniAPIKey` not defined in SQLLLM transformer');
            }
            if (!this.config.bhashiniURL) {
                this.telemetryLogger.sendErrorTelemetry(xmsg, '`bhashiniURL` not defined in SQLLLM transformer');
                throw new Error('`bhashiniURL` not defined in SQLLLM transformer');
            }
        }
        if (!xmsg.payload.text) {
            this.telemetryLogger.sendErrorTelemetry(xmsg, '`xmsg.payload.text` not defined in SQLLLM transformer');
            throw new Error('`xmsg.payload.text` not defined in SQLLLM transformer');
        }
        if (!this.config.excelParserURL) {
            this.telemetryLogger.sendErrorTelemetry(xmsg, '`excelParserURL` not defined in SQLLLM transformer');
            throw new Error('`excelParserURL` not defined in SQLLLM transformer');
        }
        if (!(this.config.xlsxIds && this.config.xlsxIds.length)) {
            this.telemetryLogger.sendErrorTelemetry(xmsg, '`xlsxIds` not defined in SQLLLM transformer');
            throw new Error('`xlsxIds` not defined in SQLLLM transformer');
        }
        console.log(this.config.xlsxIds)
        let excelId = this.config.xlsxIds[0];
        let formdata = new FormData();
        formdata.append("format", "sql");
        formdata.append("taskId", excelId);
        let requestOptions: RequestInit = {
            method: "POST",
            redirect: "follow",
            body: formdata,
        };
        let sqlResponse: any = await fetch(`${this.config.excelParserURL}/download/`, requestOptions)
        sqlResponse = await sqlResponse.json()
        let sql: any;
        if (!sqlResponse.error) {
            sql = await fetch(sqlResponse.data.url)
            sql = await sql.text()
        } else {
            this.telemetryLogger.sendErrorTelemetry(xmsg, `${sqlResponse.error} in SQLLLM transformer`);
            throw new Error(`${sqlResponse.error} in SQLLLM transformer`);
        }
        let prompt: any = [
            {
                role: 'system',
                content: `Given the following SQL schema only dump\n${sql}
                give an sql that answers below user question
                provide SQL query only. NO EXPLAIN. ONLY GIVE VAILD SQL AS RESPONSE.`
            },
            {
                role: 'user',
                content: `question: $${xmsg.payload.text}`
            }
        ]
        console.log(`SQLLLM transformer prompt(${xmsg.messageId.Id}): ${JSON.stringify(prompt, null, 3)}`);
        const openai = new OpenAI({ apiKey: this.config.APIKey });
        const response: any = await openai.chat.completions.create({
            model: this.config.model,
            messages: prompt,
            temperature: this.config.temperature || 0
        }).catch((ex) => {
            this.telemetryLogger.sendErrorTelemetry(xmsg, `SQLLLM failed. Reason: ${ex}`);
            console.error(`SQLLLM failed. Reason: ${ex}`);
            throw ex;
        });
        sql = response["choices"][0].message.content.replace(/\*\*/g, '*') || "";
        sql = sql?.replace('sql', '').trim();
        console.log("SQLLLM - sql", sql)

        formdata = new FormData();
        formdata.append("query", sql);
        formdata.append("taskId", excelId);

        requestOptions = {
            method: "POST",
            body: formdata,
            redirect: "follow"
        };

        let sqlResult: any = await fetch(`${this.config.excelParserURL}/query/`, requestOptions)
        sqlResult = await sqlResult.json()
        if (!sqlResult.error) {
            sqlResult = sqlResult.data
        } else {
            this.telemetryLogger.sendErrorTelemetry(xmsg, `${sqlResult.error} in SQLLLM transformer`);
            throw new Error(`${sqlResult.error} in SQLLLM transformer`);
        }

        prompt = [
            {
                role: 'system',
                content: `Structure the response statement as answering the user question\nAssuming answer for sql query: ${sql} is - ${JSON.stringify(sqlResult, null, 3)}.`
            },
            {
                role: 'user',
                content: `question: $${xmsg.payload.text}`
            }
        ]
        console.log(`SQLLLM transformer prompt(${xmsg.messageId.Id}): ${JSON.stringify(prompt, null, 3)}`);
        const finalResponse: any = await openai.chat.completions.create({
            model: this.config.model,
            messages: prompt,
            temperature: this.config.temperature || 0
        }).catch((ex) => {
            console.error(`SQLLLM failed. Reason: ${ex}`);
            throw ex;
        });
        let answer = finalResponse["choices"][0].message.content.replace(/\*\*/g, '*') || "";
        console.log("SQLLLM - final answer", sql)
        let from = xmsg.from;
        xmsg.from = xmsg.to;
        xmsg.to = from;
        xmsg.payload.text = answer;
        if (this.config.outputLanguage != 'en') {
            xmsg.payload.text = (await this.translateBhashini(
                'en',
                this.config.outputLanguage,
                xmsg.payload.text!
            ))['translated']
        }
        console.log("xmsg", xmsg)
        await this.sendMessage(xmsg)
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, (performance.timeOrigin + performance.now() * 1000), config['eventId']);
        return xmsg;
    }

    //triggering inboud here itself for now to enable streaming feature
    //TODO: add a queue at orchestrator and ping orchestrator here such that it tirggres outbound.
    async sendMessage(xmsg: XMessage) {
        console.log(`sending message to ${this.config.outboundURL}...`)
        try {
            var myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");
            var requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify(xmsg),
            };
            await fetch(`${this.config.outboundURL}`, requestOptions)
            return;
        } catch (error) {
            console.log("outbound error....")
            console.log(error)
        }
    }

    async translateBhashini(
        source: string,
        target: string,
        text: string
    ) {
        try {
            let config = {
                "language": {
                    "sourceLanguage": source,
                    "targetLanguage": target
                }
            }
            let bhashiniConfig: any = await getBhashiniConfig(
                'translation',
                config,
                this.config.bhashiniUserId,
                this.config.bhashiniAPIKey,
                this.config.bhashiniURL
            )
            let textArray = text.replace(/\n\n/g, "\n").split("\n")
            for (let i = 0; i < textArray.length; i++) {
                let response: any = await computeBhashini(
                    bhashiniConfig?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value,
                    "translation",
                    bhashiniConfig?.pipelineResponseConfig[0].config[0].serviceId,
                    bhashiniConfig?.pipelineInferenceAPIEndPoint?.callbackUrl,
                    config,
                    {
                        "input": [
                            {
                                "source": textArray[i]
                            }
                        ]
                    }
                )
                if (response["error"]) {
                    console.log(response["error"])
                    throw new Error(response["error"])
                }
                textArray[i] = response?.pipelineResponse[0]?.output[0]?.target
            }
            return {
                translated: textArray.join('\n'),
                error: null
            }
        } catch (error) {
            console.log(error)
            return {
                translated: "",
                error: error
            }
        }
    }
}
