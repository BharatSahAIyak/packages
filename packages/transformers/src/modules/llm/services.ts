import moment from "moment";
import OpenAI from 'openai';
import config from "../common/config";
import { PGVectorStore, OpenAI as LlamaIndexOpenAI, serviceContextFromDefaults, VectorStoreIndex } from 'llamaindex';

const aiToolsLLM = async (context: any) => {
    try {
        const userQuestion = context?.nuralCoreference || context?.messageReceived.payload.text
        if(!userQuestion) throw new Error('User question is empty')

        let expertContext = '';
        context?.similarChunks && context?.similarChunks?.forEach((doc: any, index: Number)=> {
            expertContext+=`${index}. ${doc.content}\n`
        }) || '';

        //TODO: Get this from flagsmith
        let systemInstructions = 
`
You are am assistant who helps with answering questions for users based on the search results. If question is not relevant to search reults/corpus, refuse to answer

Use below data while answering the question:
General Information:
    Today's date: {{date}}

Follow the instructions while answering :
1. You compose a comprehensive reply to the query using the relevant Corpus given and quote verbatim from the corpus as much as possible mentioning the heading and providing any mentioned links to forms and hyperlinks
2. If no part of the content is relevant/useful to the answer do not use the content, just provide an answer that that relevant content is not available.
3. Ensure you go through them all the content, reorganise them and then answer the query step by step.
4. Structure the answers in bullet points and sections and provide any mentioned hyperlinks and links to forms
5. No matter what, do not output false content

Format of the Query and Answer
Query: {question}
Answer: {answer}
`

        systemInstructions = systemInstructions.replace('{{date}}', moment().format('MMM DD, YYYY (dddd)'))
        const prompt: any = [
            {
                role: 'system',
                content: systemInstructions 
            },
            {
                role: 'user',
                content: `Relevant Corpus:\n${expertContext}`
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

const llamaIndexLLM = async (context: any) => {
    try {
        let pdfId;
        try {
            pdfId = JSON.parse(context?.messageReceived?.payload?.metaData)['pdfId']
        } catch (error) {
            console.log(error)
        }
        const userQuestion = context?.nuralCoreference || context?.messageReceived.payload.text
        if(!userQuestion) throw new Error('User question is empty')
        let vectorStore = new PGVectorStore({
            schemaName: "public",
            tableName: "vectorstore",
            connectionString: config.getConfig().llamaIndexDBURL
        })
        const openaiLLM = new LlamaIndexOpenAI({ model: "gpt-4", temperature: 0 });
        const serviceContext = serviceContextFromDefaults({ llm: openaiLLM });
        vectorStore.setCollection(pdfId || "")
        let vectorStoreIndex = await VectorStoreIndex.init({
            vectorStore,
            serviceContext,
            nodes:[]
        })
        const queryEngine = vectorStoreIndex.asQueryEngine()
        let res = await queryEngine.query(userQuestion);
        let ret =  {
            response: res.response,
            allContent: res.sourceNodes,
            error: null
        };
        return ret
    } catch(error) {
        return {
            error
        }
    }
}


const llm = async (context: any) => {
    let res;
    switch(context.llmModel){
        case 'llamaIndex-gpt-4':
            res = await llamaIndexLLM(context);
            return res
        case 'gpt-4':
            res = await aiToolsLLM(context);
            return res
        default:
            res = await llamaIndexLLM(context);
            return res
    }
}




export default {
    llm
}