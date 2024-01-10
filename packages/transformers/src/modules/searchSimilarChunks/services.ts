import axios, { AxiosRequestConfig } from 'axios';
import appConfig from "../common/config";

const searchSimilarChunks = async (context: any) => {
    const userQuestion = context?.nuralCoreference || context?.messageReceived?.payload?.text
    let pdfId;
    try {
      pdfId = JSON.parse(context?.messageReceived?.payload?.metaData)['pdfId']
    } catch (error) {
      console.log(error)
    }
    
    try {
        const config: AxiosRequestConfig = {
          headers: {
            'Content-Type': 'application/json'
          }
        };
    
        const response = await axios.post(
          `${appConfig.getConfig().BFFBaseUrl}/document/searchSimilar`,
          {
            "query": userQuestion,
            "similarityThreshold": 0,
            "matchCount": 5,
            "searchVia": "content",
            pdfId
          },
          config
        );
    
        const responseData = response.data;
        return responseData;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

export default {
    searchSimilarChunks
}