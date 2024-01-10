import { XMessage } from '@samagra-x/xmessage';
import axios, { AxiosRequestConfig } from 'axios';
import appConfig from "../common/config";

const neuralCoreference = async (context: any) => {
    let userHistory: [XMessage] = context?.userHistory;
    if(!userHistory) return context?.messageReceived?.payload?.text;
    let userHistoryString: any = userHistory.map((message: XMessage): String => {
        const convMap = JSON.parse(JSON.stringify(message.from.meta));
        if(convMap['phoneNumber']) return `User: ${message.payload.text}`
        return `AI: ${message.payload.text}`
    })
    userHistoryString.push(`User: ${context?.messageReceived?.payload?.text}`);
    userHistoryString = userHistoryString.join(' ')
    try {
        const config: AxiosRequestConfig = {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': appConfig.getConfig().aiToolsAuthHeader,
          },
        };
    
        const response = await axios.post(
          `${appConfig.getConfig().aiToolsBaseUrl}/coref/fcoref/local/`,
          { text: userHistoryString },
          config
        );
    
        const responseData = response.data.text;
        const userArray = responseData.split('User: ');
    
        return userArray[userArray.length - 1];
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export default {
    neuralCoreference
}