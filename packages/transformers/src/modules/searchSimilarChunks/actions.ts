import { assign } from 'xstate';

const searchSimilarChunksRecordResponse = assign<any,any>((context, event)=>{
    return {
        ...context,
        similarChunks: event.data
    }
})

const setNoContextOutput = assign<any,any>((context, event)=>{
    return {
        ...context,
        output: "I am sorry relavent data for your question is not available in the given context."
    }
})

export default {
    searchSimilarChunksRecordResponse,
    setNoContextOutput
}