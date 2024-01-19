import { assign } from 'xstate';

const llmUseGPT4 = assign<any,any>((context,_)=>{
    return {
        ...context,
        llmModel: 'gpt-4'
    }
})

const llmUseLlamaIndexGPT4 = assign<any,any>((context,_)=>{
    return {
        ...context,
        llmModel: 'llamaIndex-gpt-4'
    }
})

const llmRecordError = assign<any,any>((context, event)=>{
    return {
        ...context,
        error: event.data.error
    }
})

const llmRecordResponse = assign<any,any>((context, event)=>{
    return {
        ...context,
        output: event.data.response
    }
})

export default {
    llmUseGPT4,
    llmRecordError,
    llmRecordResponse,
    llmUseLlamaIndexGPT4
}