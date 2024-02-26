import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import OpenAI from 'openai';
import moment from "moment";
import { generateSentences } from "./stream/tokenizer";
import getBhashiniConfig from "../translate/bhashini/bhashini.getConfig";
import computeBhashini from "../translate/bhashini/bhashini.compute";

export class LLMTransformer implements ITransformer {

    /// Accepted config properties:
    ///     prompt: LLM prompt. (optional)
    ///     corpusPrompt: Specific instructions on corpus. (optional)
    ///     openAIAPIKey: openAI API key.
    ///     temperature: The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. (default: `0`)
    ///     model: LLM model.
    ///     enableStream: boolean which allowes user to get streaming responses if enabled.
    ///     outboundURL: Endpoint of service which sends message to end user.
    ///     outputLanguage: stream output language.
    ///     bhashiniUserId: user id for bhashini (required if provider is set to bhashini)
    ///     bhashiniAPIKey: API key for bhashini (required if provider is set to bhashini)
    ///     bhashiniURL: Base url for bhashini (required if provider is set to bhashini)
    constructor(readonly config: Record<string, any>) { }

    // TODO: use TRANSLATE transformer directly instead of repeating code
    async transform(xmsg: XMessage): Promise<XMessage> {
        console.log("LLM transformer used with: " + JSON.stringify(xmsg));
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
            throw new Error('`model` not defined in LLM transformer');
        }
        if (!this.config.openAIAPIKey) {
            throw new Error('`openAIAPIKey` not defined in LLM transformer');
        }
        if (!this.config.outboundURL){
            throw new Error('`outboundURL` not defined in LLM transformer');
        }
        if (!this.config.temperature) {
            this.config.temperature = 0;
        }
        if (!this.config.outputLanguage) {
            this.config.outputLanguage = 'en';
        }
        if(this.config.outputLanguage!='en') {
            if (!this.config.bhashiniUserId) {
                throw new Error('`bhashiniUserId` not defined in TRANSLATE transformer');
            }
            if (!this.config.bhashiniAPIKey) {
                throw new Error('`bhashiniAPIKey` not defined in TRANSLATE transformer');
            }
            if (!this.config.bhashiniURL) {
                throw new Error('`bhashiniURL` not defined in TRANSLATE transformer');
            }
        }
        if (!xmsg.payload.text) {
            throw new Error('`xmsg.payload.text` not defined in LLM transformer');
        }
        let expertContext = '';
        let searchResults: Array<{
            index: number;
            title: string;
            snippets: string;
            page: any
        }> = [];
        xmsg.transformer.metaData!.retrievedChunks?.forEach((doc: any, index: number)=> {
            expertContext+=`${index+1}: ${doc.content}\n`
            searchResults.push({
                index: index+1,
                title: doc.heading,
                snippets: doc.content,
                page: doc.metaData
            })
        }) || '';
        let systemInstructions = this.config.prompt || 'You are am assistant who helps with answering questions for users based on the search results. If question is not relevant to search reults/corpus, refuse to answer';
        systemInstructions = systemInstructions.replace('{{date}}', moment().format('MMM DD, YYYY (dddd)'))
        let contentString = this.config.corpusPrompt || 'Relevant Corpus:\n{{corpus}}'
        contentString = contentString.replace('{{corpus}}',expertContext)
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
        const openai = new OpenAI({apiKey: this.config.openAIAPIKey});
        const response: any = await openai.chat.completions.create({
            model: this.config.model,
            messages: prompt,
            temperature: this.config.temperature || 0,
            stream: this.config.enableStream
        }).catch((ex) => {
            console.error(`LLM failed. Reason: ${ex}`);
            throw ex;
        });
        let from = xmsg.from;
        xmsg.from = xmsg.to;
        xmsg.to = from;
        if(!this.config.enableStream) {
            let answer = response["choices"][0].message.content.replace(/\*\*/g, '*') || "";
            console.log("answer",answer)
            xmsg = this.postProcessResponse(xmsg, answer, searchResults)
            if(this.config.outputLanguage!='en') {
                xmsg.payload.text = (await this.translateBhashini(
                    'en',
                    this.config.outputLanguage,
                    xmsg.payload.text!
                ))['translated']
            }
            console.log("xmsg",xmsg)
        } else {
            let sentences: any, allSentences = [], output = "" ,counter = 0;
            for await (const chunk of response) {
                let currentChunk = chunk.choices[0]?.delta?.content || "";
                currentChunk = currentChunk?.replace("AI: ", "")
                output += currentChunk;
                const formattedText = output?.replace(/\n\n/g, '\n');
                sentences = generateSentences(formattedText, {
                    preserve_whitespace: true,
                });
                if (sentences && allSentences.length < sentences.length) {
                    const currentSentence = sentences[sentences.length - 2]?.replace("AI", "")
                        ?.replace("AI:")
                        ?.replace("AI: ");
                    allSentences.push(currentSentence);
                    counter++;
                    if (counter > 1) {
                        console.log("currentSentence", currentSentence)
                        xmsg = this.postProcessResponse(xmsg, currentSentence.replace(/<newline>/g, '\n'), searchResults)
                        if(this.config.outputLanguage!='en') {
                            xmsg.payload.text = (await this.translateBhashini(
                                'en',
                                this.config.outputLanguage,
                                xmsg.payload.text!
                            ))['translated']
                        }
                        await this.sendMessage(xmsg)
                    }
                }
            }
            allSentences.push(sentences[sentences.length - 1])
            console.log("currentSentence", sentences[sentences.length - 1])
            xmsg = this.postProcessResponse(xmsg, sentences[sentences.length - 1], searchResults)
            if(this.config.outputLanguage!='en') {
                xmsg.payload.text = (await this.translateBhashini(
                    'en',
                    this.config.outputLanguage,
                    xmsg.payload.text!
                ))['translated']
            }
            xmsg.payload.text = `${xmsg.payload.text}<end/>`
            await this.sendMessage(xmsg)
            xmsg.payload.text = allSentences.join(' ').replace("<end/>",'')
        }
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
        answer = answer.replace(/<<(.*?)>>/g, '').trim();
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
            answer = answer.replace(`[${ref}]`,`[${i+1}]`)
            let newSearch = searchResults[ref-1];
            newSearch.index = i+1
            updatedSearchResults.push(newSearch)
        })
        xmsg.payload.text = answer;
        xmsg.payload.metaData = JSON.stringify({
            ...JSON.parse(xmsg.payload.metaData || '{}'),
            searchResults: updatedSearchResults,
            followUpQuestions
        });
        return xmsg;
    }
    //triggering inboud here itself for now to enable streaming feature
    //TODO: add a queue at orchestrator and ping orchestrator here such that it tirggres outbound.
    async sendMessage(xmsg: XMessage){
        console.log(`sending message to ${this.config.outboundURL}...`)
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
