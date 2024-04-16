import { ButtonChoice, MediaCategory, MessageMedia, MessageType, XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
// import OpenAI from 'openai';
import moment from "moment";
import { generateSentences } from "./stream/tokenizer";
import getBhashiniConfig from "../translate/bhashini/bhashini.getConfig";
import computeBhashini from "../translate/bhashini/bhashini.compute";
import { OpenAI as llamaindexOpenAI, serviceContextFromDefaults, Groq } from "llamaindex";
import OpenAI from "openai";
import { Events } from "@samagra-x/uci-side-effects";
import {v4 as uuid4} from 'uuid';

export class LLMTransformer implements ITransformer {

    /// Accepted config properties:

    ///     APIKey: Provider's API key.
    ///     model: LLM model.
    ///     outboundURL: Endpoint of service which sends message to end user. Required if `enableStream` is set to `true`.
    ///     bhashiniUserId: user id for bhashini (required if provider is set to bhashini)
    ///     bhashiniAPIKey: API key for bhashini (required if provider is set to bhashini)
    ///     bhashiniURL: Base url for bhashini (required if provider is set to bhashini)
    ///     provider: LLM API provider (optional), default is openAI
    ///     prompt: LLM prompt, priority would be to use `xmsg.transformer.metaData.prompt`, if this null then the value passed here will be used. (optional)
    ///     corpusPrompt: Specific instructions on corpus. (optional)
    ///     temperature: The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. (default: `0`) (optional)
    ///     enableStream: boolean which allowes user to get streaming responses if enabled. By default this is set to `false`. (optional)
    ///     outputLanguage: Stream output language. Defaults to 'en'. (optional)
    constructor(readonly config: Record<string, any>) { }

    // TODO: use TRANSLATE transformer directly instead of repeating code
    async transform(xmsg: XMessage): Promise<XMessage> {
        const startTime = Date.now();
        this.sendLogTelemetry(xmsg, `ID: ${this.config.transformerId} , Type: LLM Started`, startTime);
        console.log("LLM transformer called.");
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
            this.sendErrorTelemetry(xmsg, '`model` not defined in LLM transformer');
            throw new Error('`model` not defined in LLM transformer');
        }
        if (!this.config.APIKey) {
            this.sendErrorTelemetry(xmsg, '`APIKey` not defined in LLM transformer');
            throw new Error('`APIKey` not defined in LLM transformer');
        }
        //TODO: Fix this later.
        process.env['OPENAI_API_KEY']=this.config.APIKey;
        if (!this.config.temperature) {
            this.config.temperature = 0;
        }
        if (!this.config.outputLanguage) {
            this.config.outputLanguage = xmsg?.transformer?.metaData?.inputLanguage || 'en';
        }
        if(this.config.outputLanguage!='en') {
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
        let mediaUrls:Array<string> = []
        xmsg.transformer.metaData!.retrievedChunks?.forEach((doc: any, index: number)=> {
            expertContext+=`${index+1}: ${doc.content}\n`
            searchResults.push({
                index: index+1,
                title: doc.heading,
                snippets: doc.content,
                page: doc.metaData
            })
            if(doc.video && mediaUrls.indexOf(doc.video)==-1){
                xmsg.messageType = MessageType.HSM
                mediaUrls.push(doc.video)
                media.push({
                    category: MediaCategory.VIDEO_URL,
                    url: doc.video
                })
            }
        }) || '';
        let systemInstructions = xmsg.transformer?.metaData?.prompt || this.config.prompt || 'You are am assistant who helps with answering questions for users based on the search results. If question is not relevant to search reults/corpus, refuse to answer';
        systemInstructions = systemInstructions?.replace('{{date}}', moment().format('MMM DD, YYYY (dddd)'))
        let contentString = this.config.corpusPrompt || 'Relevant Corpus:\n{{corpus}}'
        contentString = contentString?.replace('{{corpus}}',expertContext)
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
        xmsg.transformer.metaData?.userHistory.forEach((message:any) => {
            prompt.push({
                role: message?.from?.meta?.phoneNumber ? "user": "assistant",
                content: message?.payload?.text
            })
        });
        prompt.push({
            role: "user",
            content: 
            `
            Query: ${xmsg?.payload?.text}
            Answer:
            `
        })
        console.log(`LLM transformer prompt(${xmsg.messageId.Id}): ${JSON.stringify(prompt,null,3)}`);

        //llamaIndex implementaion
        let llm: any;
        let response: any;

        if(this.config.provider?.toLowerCase() == "groq"){
            llm = new Groq({apiKey: this.config.APIKey});
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
            const openai = new OpenAI({apiKey: this.config.APIKey});
            response = await openai.chat.completions.create({
                model: this.config.model,
                messages: prompt,
                temperature: this.config.temperature || 0,
                stream: this.config.enableStream ?? false,
            }).catch((ex) => {
                console.error(`LLM failed. Reason: ${ex}`);
                throw ex;
            });
        }
                
        this.switchFromTo(xmsg);
        const oldMessageId = xmsg.messageId.Id;
        const newMessageId = uuid4();
        xmsg.messageId.Id = newMessageId;
        if(!this.config.enableStream) {
            let answer;
            if(this.config.provider?.toLowerCase() == "groq") answer = response.message.content?.replace(/\*\*/g, '*') || "";
            else answer = response["choices"][0].message.content?.replace(/\*\*/g, '*') || "";
            xmsg = this.postProcessResponse(xmsg, answer, searchResults)
            if(this.config.outputLanguage!='en') {
                xmsg.payload.text = (await this.translateBhashini(
                    'en',
                    this.config.outputLanguage,
                    xmsg.payload.text!
                ))['translated']
            }
            xmsg.payload.media = media;
            console.log("xmsg",xmsg)
            await this.sendMessage(xmsg)
        } else {
            if (!this.config.outboundURL){
                throw new Error('`outboundURL` not defined in LLM transformer');
            }
            let sentences: any, allSentences = [], translatedSentences = [], output = "" ,counter = 0;
            for await (const chunk of response) {
                let currentChunk: any;
                if(this.config.provider?.toLowerCase() == "groq") currentChunk = chunk.delta || "";
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
                        xmsg = this.postProcessResponse(xmsg, currentSentence, searchResults)
                        if(this.config.outputLanguage!='en') {
                            xmsg.payload.text = (await this.translateBhashini(
                                'en',
                                this.config.outputLanguage,
                                xmsg.payload.text!
                            ))['translated']
                        }
                        translatedSentences.push(xmsg.payload.text);
                        xmsg.payload.media = media;
                        xmsg.payload.text = translatedSentences.join(' ');
                        await this.sendMessage(xmsg)
                    }
                }
            }
            allSentences.push(sentences[sentences.length - 1])
            xmsg = this.postProcessResponse(xmsg, sentences[sentences.length - 1], searchResults)
            if(this.config.outputLanguage!='en') {
                xmsg.payload.text = (await this.translateBhashini(
                    'en',
                    this.config.outputLanguage,
                    xmsg.payload.text!
                ))['translated']
            }
            translatedSentences.push(xmsg.payload.text);
            xmsg.payload.text = `${translatedSentences.join(' ')}<end/>`
            xmsg.payload.text = xmsg.payload.text?.replace(/<newline>/g, '\n');
            xmsg.payload.media = media;
            await this.sendMessage(xmsg)
            xmsg.payload.text = translatedSentences.join(' ')?.replace("<end/>",'')
            xmsg.transformer = {
                ...xmsg.transformer,
                metaData: {
                    ...xmsg.transformer?.metaData,
                    responseInEnglish: allSentences.join(' ')?.replace("<end/>",'')
                }
            }
        }
        delete process.env['OPENAI_API_KEY'];
        xmsg.messageId.Id = oldMessageId;
        this.switchFromTo(xmsg);
        this.sendLogTelemetry(xmsg, `ID: ${this.config.transformerId} , Type: LLM generated response!`, startTime);
        xmsg.messageId.Id = newMessageId;
        this.switchFromTo(xmsg);
        return xmsg;
    }

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
        referencesArray = referencesArray.sort((a,b)=>a-b);
        let updatedSearchResults: Array<{
            index: number;
            title: string;
            snippets: string;
            page: any
        }> = [];
        referencesArray.forEach((ref,i)=>{
            answer = answer?.replace(`[${ref}]`,`[${i+1}]`)
            let newSearch = searchResults[ref-1];
            newSearch.index = i+1
            updatedSearchResults.push(newSearch)
        })
        xmsg.payload.text = answer;
        xmsg.payload.metaData!['searchResults'] = updatedSearchResults;
        xmsg.payload.buttonChoices = followUpQuestions.map((question: string, index: number): ButtonChoice=>{return {key: `${index}`,text: question,backmenu: false}})
        return xmsg;
    }
    //triggering inboud here itself for now to enable streaming feature
    //TODO: add a queue at orchestrator and ping orchestrator here such that it tirggres outbound.
    async sendMessage(xmsg: XMessage){
        console.log(`sending message to ${this.config.outboundURL}...`)
        console.log('-------------------------------------------------------------')
        console.log(xmsg.payload.text)
        // This also reduces payload size and prevents 413 error.
        delete xmsg.transformer?.metaData?.userHistory;
        xmsg.transformer!.metaData!.messageIdChanged = true;
        try{
          var myHeaders = new Headers();
          myHeaders.append("Content-Type", "application/json");
          var requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: JSON.stringify(xmsg),
          };
          await fetch(`${this.config.outboundURL}`, requestOptions)
          return;
        } catch (error){
            console.log("outbound error....")
          console.log(error)
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
        const xmgCopy = {...xmsg};
        xmgCopy.transformer!.metaData!.errorString = error;
        this.config.eventBus.pushEvent({
          eventName: Events.CUSTOM_TELEMETRY_EVENT_ERROR,
          transformerId: this.config.transformerId,
          eventData: xmgCopy,
          timestamp: Date.now(),
        })
    }

    private async sendLogTelemetry(xmsg: XMessage, log: string, startTime: number) {
        const xmgCopy = {...xmsg};
        xmgCopy.transformer!.metaData!.telemetryLog = log;
        xmgCopy.transformer!.metaData!.stateExecutionTime = Date.now() - startTime;
        this.config.eventBus.pushEvent({
          eventName: Events.CUSTOM_TELEMETRY_EVENT_LOG,
          transformerId: this.config.transformerId,
          eventData: xmgCopy,
          timestamp: Date.now(),
        })
    }

    private switchFromTo(xmsg: XMessage): XMessage {
        const from = xmsg.from;
        xmsg.from = xmsg.to;
        xmsg.to = from;
        return xmsg;
    }
}
