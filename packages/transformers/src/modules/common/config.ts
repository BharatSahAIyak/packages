// config.js
let config = {
    openAIKey: '',
    aiToolsAuthHeader: '',
    aiToolsBaseUrl: '',
    BFFBaseUrl: '',
    llamaIndexDBURL: ''
};
  
const setConfig = (newConfig: any) => {
    config = { ...config, ...newConfig };
};
  
const getConfig = () => config;
  
export default {
    setConfig,
    getConfig,
};