// config.js
let config = {
    openAIKey: ''
};
  
const setConfig = (newConfig: any) => {
    config = { ...config, ...newConfig };
};
  
const getConfig = () => config;
  
export default {
    setConfig,
    getConfig,
};