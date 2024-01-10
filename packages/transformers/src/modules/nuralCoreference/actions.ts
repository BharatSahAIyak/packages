import { assign } from 'xstate';

const neuralCoreferenceRecordResponse = assign<any,any>((context, event)=>{
    return {
        ...context,
        nuralCoreference: event.data
    }
})

export default {
    neuralCoreferenceRecordResponse
}