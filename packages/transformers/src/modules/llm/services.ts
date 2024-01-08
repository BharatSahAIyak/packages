import moment from "moment";
import OpenAI from 'openai';
import config from "../common/config";

const llm = async (context: any) => {
    try {
        const userQuestion = context?.nuralCoreference || context?.messageReceived.payload.text
        if(!userQuestion) throw new Error('User question is empty')

        let expertContext = context?.similarDocs && context?.similarDocs?.forEach((doc: any, index: Number)=> {
            expertContext+=`${index}. ${doc.content}\n`
        }) || '';

        //TODO: Get this from flagsmith
        let systemInstructions = 
`
You are a Employee onbaording assistant who helps with answering questions for Samagra employees based on the search results. If question is not relevant to search reults/corpus, refuse to answer

Use below data while answering the question:
General Information:
    Today's date: {{date}}
{{employeeData}}


Follow the instructions while answering :
1. You compose a comprehensive reply to the query using the relevant Samagra Corpus given and quote verbatim from the corpus as much as possible mentioning the heading and providing any mentioned links to forms and hyperlinks
2. If no part of the content is relevant/useful to the answer do not use the content, just provide an answer that that relevant content is not available.
3. Ensure you go through them all the content, reorganise them and then answer the query step by step.
4. Structure the answers in bullet points and sections and provide any mentioned hyperlinks and links to forms
5. No matter what, do not output false content

Format of the Query and Answer
Query: {question}
Answer: {answer}
`

        systemInstructions = systemInstructions.replace('{{data}}', moment().format('MMM DD, YYYY (dddd)'))
        systemInstructions = systemInstructions.replace('{{employeeData}}', context?.employeeData || '')
        const prompt: any = [
            {
                role: 'system',
                content: systemInstructions 
            },
            {
                role: 'user',
                content: `Relevant Samagra Corpus:\n${expertContext}`
            }
        ]
        
        context.userHistory.forEach((message:any) => {
            prompt.push({
                role: message?.from?.meta?.phoneNumber ? "user": "assistant",
                content: message?.payload?.text
            })
        });

        prompt.push({
            role: "user",
            content: 
`
Query: ${userQuestion}
Answer:
`
        })

        const openai = new OpenAI({apiKey: config.getConfig().openAIKey});
        const response: any = await openai.chat.completions.create({
            model: context.llmModel,
            messages: prompt
        }).catch((err) => {
            throw err;
        });

        const error = Object.keys(response).indexOf('error')!=-1
        let ret =  {
            response: error ? null : response["choices"][0].message.content,
            allContent: error ? null : response,
            error: error ? response.error : null
        };
        return ret
    } catch (error) {
        return {
            error
        }
    }
}

export default {
    llm
}