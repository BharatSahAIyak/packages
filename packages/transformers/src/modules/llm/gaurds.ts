const llmIfError = (_:any,event:any) => {
    if(!event.data['response']){
        return true
    }
    if(event.data.error){
        return true
    }
}

export default {
    llmIfError
}