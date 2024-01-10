const neuralCoreferenceIfResponseIsEmpty = (_:any,event:any) => {
    if(!event.data){
        return true
    }
    if(event.data.error){
        return true
    }
}

export default {
    neuralCoreferenceIfResponseIsEmpty
}