// config.js
let config = {
    openAIKey: '',
    aiToolsAuthHeader: '',
    aiToolsBaseUrl: '',
    BFFBaseUrl: ''
};
  
const setConfig = (newConfig: any) => {
    config = { ...config, ...newConfig };
};
  
const getConfig = () => config;
  
export default {
    setConfig,
    getConfig,
};