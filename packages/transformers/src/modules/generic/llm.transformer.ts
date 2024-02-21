import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../common/transformer.interface";
import OpenAI from 'openai';
import moment from "moment";

export class LLMTransformer implements ITransformer {

    /// Accepted config properties:
    ///     prompt: LLM prompt. (optional)
    ///     corpusPrompt: Specific instructions on corpus. (optional)
    ///     openAIAPIKey: openAI API key.
    ///     temperature: The sampling temperature, between 0 and 1. Higher values like 0.8 will make the output more random, while lower values like 0.2 will make it more focused and deterministic. (default: `0`)
    ///     model: LLM model. (default: `gpt-3.5-turbo`)
    constructor(readonly config: Record<string, any>) { }

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
        if (!this.config.temperature) {
            this.config.temperature = 0;
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
        console.log(`LLM transformer prompt(${xmsg.messageId.Id}): ${prompt}`);
        const openai = new OpenAI({apiKey: this.config.openAIAPIKey});
        const response: any = await openai.chat.completions.create({
            model: this.config.model,
            messages: prompt,
            temperature: this.config.temperature || 0,
        }).catch((ex) => {
            console.error(`LLM failed. Reason: ${ex}`);
            throw ex;
        });
        let answer = response["choices"][0].message.content.replace(/\*\*/g, '*') || "";
        let followUpQuestions = []
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
}
