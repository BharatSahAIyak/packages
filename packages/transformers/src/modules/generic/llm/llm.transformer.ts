import { ButtonChoice, MediaCategory, MessageMedia, MessageType, XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
const config = require('./config.json');
// import OpenAI from 'openai';
import moment from "moment";
import { generateSentences } from "./stream/tokenizer";
import getBhashiniConfig from "../translate/bhashini/bhashini.getConfig";
import computeAzure from "../translate/azure/azure.compute";
import computeBhashini from "../translate/bhashini/bhashini.compute";
import { serviceContextFromDefaults, Groq } from "llamaindex";
import OpenAI from "openai";
import { Events } from "@samagra-x/uci-side-effects";
import { v4 as uuid4 } from 'uuid';

export class LLMTransformer implements ITransformer {

    /// Accepted config properties:

    ///     APIKey: Provider's API key.
    ///     model: LLM model.
    ///     outboundURL: Endpoint of service which sends message to end user. Required if `enableStream` is set to `true`.
    ///     bhashiniUserId: user id for bhashini (required if provider is set to bhashini)
    ///     bhashiniAPIKey: API key for bhashini (required if provider is set to bhashini)
    ///     bhashiniURL: Base url for bhashini (required if provider is set to bhashini)
    ///     provider: LLM API provider (optional), default is openAI
    ///     languageProvider: Provider service to be used.
    ///     prompt: LLM prompt, Primarily taken from config.prompt, incase not given in config it is fetched from `xmsg.transformer.metaData.prompt`, if this null then the value passed here will be used. (optional)
    ///     corpusPrompt: Specific instructions on corpus. (optional)
    ///     temperature: The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. (default: `0`) (optional)
    ///     enableStream: boolean which allowes user to get streaming responses if enabled. By default this is set to `false`. (optional)
    ///     outputLanguage: Stream output language. Defaults to 'en'. (optional)
    ///     responseFormat: Used to pass the json schema of the reponse format for OpenAI LLM calls. (optional)
    constructor(readonly config: Record<string, any>) {}

    // TODO: use TRANSLATE transformer directly instead of repeating code
    async transform(xmsg: XMessage): Promise<XMessage> {
        const startTime = Math.floor((performance.timeOrigin + performance.now()) * 1000);
        this.sendLogTelemetry(xmsg, `ID: ${this.config.transformerId} , Type: LLM Started`, startTime, config['eventId']);
        console.log("LLM transformer called.");
        if (!xmsg.transformer?.metaData?.userHistory || !xmsg.transformer?.metaData?.userHistory?.length) {
            xmsg.transformer = {
                ...xmsg.transformer,
                metaData: {
                    ...xmsg.transformer?.metaData,
                    userHistory: []
                }
            };
        }
        if (!this.config.model) {
            this.sendErrorTelemetry(xmsg, '`model` not defined in LLM transformer');
            throw new Error('`model` not defined in LLM transformer');
        }
        if (!this.config.APIKey) {
            this.sendErrorTelemetry(xmsg, '`APIKey` not defined in LLM transformer');
            throw new Error('`APIKey` not defined in LLM transformer');
        }
        //TODO: Fix this later.
        process.env['OPENAI_API_KEY'] = this.config.APIKey;
        if (!this.config.temperature) {
            this.config.temperature = 0;
        }
        if (!this.config.outputLanguage) {
            this.config.outputLanguage = xmsg?.transformer?.metaData?.inputLanguage || 'en';
        }
        if (this.config.outputLanguage != 'en') {
            if (!this.config.bhashiniUserId) {
                this.sendErrorTelemetry(xmsg, '`bhashiniUserId` not defined in TRANSLATE transformer');
                throw new Error('`bhashiniUserId` not defined in TRANSLATE transformer');
            }
            if (!this.config.bhashiniAPIKey) {
                this.sendErrorTelemetry(xmsg, '`bhashiniAPIKey` not defined in TRANSLATE transformer');
                throw new Error('`bhashiniAPIKey` not defined in TRANSLATE transformer');
            }
            if (!this.config.bhashiniURL) {
                this.sendErrorTelemetry(xmsg, '`bhashiniURL` not defined in TRANSLATE transformer');
                throw new Error('`bhashiniURL` not defined in TRANSLATE transformer');
            }
        }
        if (!xmsg.payload.text) {
            this.sendErrorTelemetry(xmsg, '`xmsg.payload.text` not defined in LLM transformer');
            throw new Error('`xmsg.payload.text` not defined in LLM transformer');
        }
        let expertContext = '';
        let searchResults: Array<{
            index: number;
            title: string;
            snippets: string;
            page: any
        }> = [];
        let media: Array<MessageMedia> = []
        let mediaUrls: Array<string> = []
        console.error("Chunks", xmsg?.transformer?.metaData?.retrievedChunks);
        if (xmsg?.transformer?.metaData?.retrievedChunks?.message != 'No chunks found for given parameters') {
            xmsg?.transformer?.metaData?.retrievedChunks?.forEach((doc: any, index: number) => {
                expertContext += `${index + 1}: ${doc.content}\n`
                searchResults.push({
                    index: index + 1,
                    title: doc.heading,
                    snippets: doc.content,
                    page: doc.metaData
                })
                if (doc.video && mediaUrls.indexOf(doc.video) == -1) {
                    xmsg.messageType = MessageType.HSM
                    mediaUrls.push(doc.video)
                    media.push({
                        category: MediaCategory.VIDEO_URL,
                        url: doc.video
                    })
                }
            }) || '';
        }

        let systemInstructions: string = this.config.prompt || xmsg.transformer?.metaData?.prompt || 'You are am assistant who helps with answering questions for users based on the search results. If question is not relevant to search reults/corpus, refuse to answer';
        systemInstructions = systemInstructions?.replace('{{date}}', moment().format('MMM DD, YYYY (dddd)'))
        let contentString = this.config.corpusPrompt || 'Relevant Corpus:\n{{corpus}}'
        contentString = contentString?.replace('{{corpus}}', expertContext)
        const prompt: any = [
            {
                role: 'system',
                content: systemInstructions
            },
            {
                role: 'user',
                content: contentString
            }
        ]
        xmsg.transformer.metaData?.userHistory.filter((message: any) => {
            if (message.from == 'admin') return true
            else return false
        }).forEach((message: any) => {
            if (message?.metaData?.transalatedQuery) {
                prompt.push({
                    role: "user",
                    content: message?.metaData?.transalatedQuery
                })
                prompt.push({
                    role: "assistant",
                    content: message?.metaData?.responseInEnglish || message?.payload?.text
                })
            }
        });
        prompt.push({
            role: "user",
            content: xmsg?.payload?.text
        })
        xmsg.transformer.metaData!.prompt = prompt;
        this.sendLogTelemetry(xmsg, `ID: ${this.config.transformerId} , Prompt prepared ${JSON.stringify(prompt, null, 3)}`, startTime, config['eventId'])
        console.log(`LLM transformer prompt(${xmsg.messageId.Id}): ${JSON.stringify(prompt, null, 3)}`);

        //llamaIndex implementaion
        let llm: any;
        let response: any;
        let responseStartTime = Math.floor((performance.timeOrigin + performance.now()) * 1000);
        let streamStartLatency;

        this.sendLogTelemetry(xmsg, `Triggering LLM with config: ${{
            stream: this.config.enableStream ?? false,
            model: this.config.model,
            provider: this.config.provider,
        }}`, startTime)


        if (this.config.provider?.toLowerCase() == "groq") {
            llm = new Groq({ apiKey: this.config.APIKey });
            const serviceContext = serviceContextFromDefaults({ llm });
            response = await serviceContext.llm.chat({
                messages: prompt,
                stream: this.config.enableStream ?? false
            }).catch((ex) => {
                console.error(`LLM failed. Reason: ${ex}`);
                throw ex;
            });
        } else {
            // OPEN AI Implementaion
            let openAIConfig: any = {
                apiKey: this.config.APIKey
            }
            if ([
                'krutrim',
                'mistralai',
                'meta',
                'google'
            ].indexOf(this.config.provider) != -1) {
                openAIConfig['baseURL'] = 'https://cloud.olakrutrim.com/v1';
            }
            console.log('openAIConfig', openAIConfig);
            const openai = new OpenAI(openAIConfig);
            const openAIChatConfig: any = {
                model: this.config.model,
                messages: prompt,
                temperature: this.config.temperature || 0,
                stream: this.config.enableStream ?? false,
                top_p: this.config.top_p ?? 1
            };
            if (this.config.responseFormat) {
                openAIChatConfig.response_format = this.config.responseFormat;
            }
            response = await openai.chat.completions.create(openAIChatConfig).catch((ex) => {
                console.error(`LLM failed. Reason: ${ex}`);
                throw ex;
            });
        }

        xmsg.messageId.replyId = xmsg.messageId.Id;
        if (!this.config.enableStream) {
            let answer;
            if (this.config.provider?.toLowerCase() == "groq") answer = response.message.content?.replace(/\*\*/g, '*') || "";
            else answer = response["choices"][0].message.content?.replace(/\*\*/g, '*') || "";
            try {
                xmsg = this.postProcessResponse(xmsg, answer, searchResults)
            } catch (err) {
                console.log('post processing failed with error: ', err);
            }
            if (this.config.outputLanguage != 'en') {
                if (this.config.languageProvider == "bhashini") {
                    xmsg.payload.text = (await this.translateBhashini(
                        'en',
                        this.config.outputLanguage,
                        xmsg.payload.text!
                    ))['translated']
                } else if (this.config.languageProvider == "azure") {
                    xmsg.payload.text = (await this.translateAzure(
                        'en',
                        this.config.outputLanguage,
                        xmsg.payload.text!,
                        xmsg
                    ))['translated']
                } else {
                    xmsg.payload.text = (await this.translateAzure(
                        'en',
                        this.config.outputLanguage,
                        xmsg.payload.text!,
                        xmsg
                    ))['translated']
                }
            }
            xmsg.payload.media = media;
            this.sendLogTelemetry(xmsg, `ID: ${this.config.transformerId} , Type: LLM generated response!`, startTime, config['eventId']);
        } else {
            const newMessageId = uuid4();
            if (!this.config.outboundURL) {
                throw new Error('`outboundURL` not defined in LLM transformer');
            }
            let sentences: any, allSentences = [], translatedSentences = [], output = "", counter = 0;
            for await (const chunk of response) {
                if (!streamStartLatency) {
                    streamStartLatency = Math.floor((performance.timeOrigin + performance.now()) * 1000) - responseStartTime;
                }
                let currentChunk: any;
                if (this.config.provider?.toLowerCase() == "groq") currentChunk = chunk.delta || "";
                else currentChunk = chunk.choices[0]?.delta?.content || "";
                currentChunk = currentChunk?.replace("AI: ", "")
                output += currentChunk;
                let formattedText = output?.replace(/\n\n/g, '<newline>');
                formattedText = formattedText?.replace(/\n/g, '<newline>');
                sentences = generateSentences(formattedText, {
                    preserve_whitespace: true,
                });
                if (sentences && allSentences.length < sentences.length) {
                    let currentSentence = sentences[sentences.length - 2]?.replace("AI", "")
                        ?.replace("AI:")
                        ?.replace("AI: ");
                    currentSentence = currentSentence?.replace(/<newline>/g, '\n');
                    allSentences.push(currentSentence);
                    counter++;
                    if (counter > 1) {
                        try {
                            xmsg = this.postProcessResponse(xmsg, currentSentence, searchResults)
                        } catch (err) {
                            console.error('post processing failed with error', err);
                        }
                        if (this.config.outputLanguage != 'en') {
                            if (this.config.languageProvider == "bhashini") {
                                xmsg.payload.text = (await this.translateBhashini(
                                    'en',
                                    this.config.outputLanguage,
                                    xmsg.payload.text!
                                ))['translated']
                            } else if (this.config.languageProvider == "azure") {
                                xmsg.payload.text = (await this.translateAzure(
                                    'en',
                                    this.config.outputLanguage,
                                    xmsg.payload.text!,
                                    xmsg
                                ))['translated']
                            } else {
                                xmsg.payload.text = (await this.translateAzure(
                                    'en',
                                    this.config.outputLanguage,
                                    xmsg.payload.text!,
                                    xmsg
                                ))['translated']
                            }
                        }
                        translatedSentences.push(xmsg.payload.text);
                        xmsg.payload.media = media;
                        xmsg.payload.text = translatedSentences.join(' ');
                        xmsg.payload.text = xmsg.payload.text?.replace(/<newline>/g, '\n');
                        const msgCopy = JSON.parse(JSON.stringify(xmsg));
                        this.switchFromTo(msgCopy);
                        msgCopy.messageId.Id = newMessageId;
                        await this.sendMessage(msgCopy);
                    }
                }
            }
            allSentences.push(sentences[sentences.length - 1])
            try {
                xmsg = this.postProcessResponse(xmsg, sentences[sentences.length - 1], searchResults)
            } catch (err) {
                console.error('post processing failed with error', err);
            }
            if (this.config.outputLanguage != 'en') {
                if (this.config.languageProvider == "bhashini") {
                    xmsg.payload.text = (await this.translateBhashini(
                        'en',
                        this.config.outputLanguage,
                        xmsg.payload.text!
                    ))['translated']
                } else if (this.config.languageProvider == "azure") {
                    xmsg.payload.text = (await this.translateAzure(
                        'en',
                        this.config.outputLanguage,
                        xmsg.payload.text!,
                        xmsg
                    ))['translated']
                } else {
                    xmsg.payload.text = (await this.translateAzure(
                        'en',
                        this.config.outputLanguage,
                        xmsg.payload.text!,
                        xmsg
                    ))['translated']
                }
            }
            translatedSentences.push(xmsg.payload.text);
            xmsg.payload.text = `${translatedSentences.join(' ')}<end/>`
            xmsg.payload.text = xmsg.payload.text?.replace(/<newline>/g, '\n');
            xmsg.payload.media = media;
            xmsg.payload.text = xmsg.payload.text?.replace(/<newline>/g, '\n');
            xmsg.payload.text = xmsg.payload.text?.replace(/<ନୂତନ ଲାଇନ୍>/g, '\n');
            xmsg.payload.text = xmsg.payload.text?.replace(/<न्यूलाइन>/g, '\n');
            xmsg.payload.text = xmsg.payload.text?.replace(/<नई लाइन>/g, '\n');
            xmsg.transformer = {
                ...xmsg.transformer,
                metaData: {
                    ...xmsg.transformer?.metaData,
                    streamMessageId: newMessageId,
                    responseInEnglish: allSentences.join(' ')?.replace("<end/>", '')?.replace(/<newline>/g, '\n')?.replace(/<ନୂତନ ଲାଇନ୍>/g, '\n')?.replace(/<न्यूलाइन>/g, '\n')?.replace(/<नई लाइन>/g, '\n'),
                    streamStartLatency
                }
            }
            this.sendLogTelemetry(xmsg, `ID: ${this.config.transformerId} , Type: LLM generated response!`, startTime, config['eventId']);
        }
        delete process.env['OPENAI_API_KEY'];
        return xmsg;
    }

    /**
     * Function to figure out follow up questions and references basis a regex.
     * @param xmsg 
     * @param answer 
     * @param searchResults 
     * @returns 
     */
    postProcessResponse(xmsg: XMessage, answer: string, searchResults: Array<{
        index: number;
        title: string;
        snippets: string;
        page: any
    }>): XMessage {
        let followUpQuestions: any = []
        const matches = answer.match(/<<(.*?)>>/g)
        if (matches) {
            followUpQuestions = matches.map((match: string) => match.slice(2, -2).trim());
        }
        answer = answer?.replace(/<<(.*?)>>/g, '').trim();
        const referenceRegex = /\[(\d+)\]/g;
        let referencesArray = [];
        let match;
        while ((match = referenceRegex.exec(answer)) !== null) {
            referencesArray.push(parseInt(match[1]));
        }
        referencesArray = referencesArray.sort((a, b) => a - b);
        let updatedSearchResults: Array<{
            index: number;
            title: string;
            snippets: string;
            page: any
        }> = [];
        referencesArray.forEach((ref, i) => {
            answer = answer?.replace(`[${ref}]`, `[${i + 1}]`)
            let newSearch = searchResults[ref - 1] ?? {};
            newSearch.index = i + 1
            updatedSearchResults.push(newSearch)
        })
        xmsg.payload.text = answer;
        xmsg.payload.metaData!['searchResults'] = updatedSearchResults;
        if (followUpQuestions.length > 0) {
            xmsg.payload.buttonChoices = {
                choices: followUpQuestions.map((question: string, index: number): ButtonChoice => { return { key: `${index}`, text: question, isEnabled: true } })
            };
        }
        return xmsg;
    }

    //triggering inboud here itself for now to enable streaming feature
    //TODO: add a queue at orchestrator and ping orchestrator here such that it tirggres outbound.
    async sendMessage(xmsg: XMessage) {
        console.log(`sending message to ${this.config.outboundURL}...`)
        console.log('-------------------------------------------------------------')
        xmsg.payload.text = xmsg.payload.text?.replace(/<newline>/g, '\n');
        xmsg.payload.text = xmsg.payload.text?.replace(/<ନୂତନ ଲାଇନ୍>/g, '\n');
        xmsg.payload.text = xmsg.payload.text?.replace(/<न्यूलाइन>/g, '\n');
        xmsg.payload.text = xmsg.payload.text?.replace(/<नई लाइन>/g, '\n');
        console.log(xmsg.payload.text)
        // This also reduces payload size and prevents 413 error.
        delete xmsg.transformer?.metaData?.userHistory;
        xmsg.transformer!.metaData!.messageIdChanged = true;
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

    async translateAzure(
        source: string,
        target: string,
        text: string,
        xmsg: XMessage
    ) {
        try {
            let response: any = await computeAzure({
                sourceLanguage: source,
                targetLanguage: target,
                text,
                botId: xmsg.app,
                orgId: xmsg.orgId
            }, this.config.bhashiniURL);
            return {
                translated: response.translated,
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

    // TODO: extract out this functionality
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
            let textArray = text?.replace(/\n\n/g, "\n").split("\n")
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

    private async sendErrorTelemetry(xmsg: XMessage, error: string) {
        const xmgCopy = { ...xmsg };
        xmgCopy.transformer!.metaData!.errorString = error;
        this.config.eventBus.pushEvent({
            eventName: Events.CUSTOM_TELEMETRY_EVENT_ERROR,
            transformerId: this.config.transformerId,
            eventData: xmgCopy,
            timestamp: Math.floor((performance.timeOrigin + performance.now()) * 1000),
        })
    }

    private async sendLogTelemetry(xmsg: XMessage, log: string, startTime: number, eventId?: string) {
        const xmgCopy = { ...xmsg };
        xmgCopy.transformer!.metaData!.telemetryLog = log;
        xmgCopy.transformer!.metaData!.stateExecutionTime = Math.floor((performance.timeOrigin + performance.now()) * 1000) - startTime;
        xmgCopy.transformer!.metaData!.eventId = eventId;
        this.config.eventBus.pushEvent({
            eventName: Events.CUSTOM_TELEMETRY_EVENT_LOG,
            transformerId: this.config.transformerId,
            eventData: xmgCopy,
            timestamp: Math.floor((performance.timeOrigin + performance.now()) * 1000),
        })
    }

    private switchFromTo(xmsg: XMessage): XMessage {
        const from = xmsg.from;
        xmsg.from = xmsg.to;
        xmsg.to = from;
        return xmsg;
    }
}
