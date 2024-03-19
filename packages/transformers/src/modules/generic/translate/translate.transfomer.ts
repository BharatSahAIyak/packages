import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import getBhashiniConfig from "./bhashini/bhashini.getConfig";
import computeBhashini from "./bhashini/bhashini.compute";

export class TranslateTransformer implements ITransformer {

    /// Accepted config properties:
    ///     provider: translate service provider (Bhashini | Azure)
    ///     inputLanguage: input text language, defaults to `xmsg.transformer.metaData.inputLanguage` if null, if `xmsg.transformer.metaData.inputLanguage` is null then defaults to en
    ///     outputLanguage: output text language, defaults to `xmsg.transformer.metaData.outputLanguage` if null, if `xmsg.transformer.metaData.outputLanguage` is null then defaults to en
    ///     bhashiniUserId: user id for bhashini (required if provider is set to bhashini)
    ///     bhashiniAPIKey: API key for bhashini (required if provider is set to bhashini)
    ///     bhashiniURL: Base url for bhashini (required if provider is set to bhashini)
    constructor(readonly config: Record<string, any>) { }

    async transform(xmsg: XMessage): Promise<XMessage> {
      if (!xmsg.transformer) {
          xmsg.transformer = {
              metaData: {}
          };
      }
      if (!this.config.provider) {
        throw new Error('`provider` not defined in TRANSLATE transformer');
      }
      if (!this.config.inputLanguage) {
        this.config.inputLanguage = xmsg?.transformer?.metaData?.inputLanguage || 'en';
      }
      if (!this.config.outputLanguage) {
        this.config.inputLanguage = xmsg?.transformer?.metaData?.outputLanguage || 'en';
      }
      if(!xmsg?.payload?.text){
        throw new Error('`input payload` not defined in TRANSLATE transformer');
      }
      console.log("TRANSLATE transformer called.", this.config.inputLanguage, this.config.outputLanguage);
      if(this.config.inputLanguage==this.config.outputLanguage){
        return xmsg;
      }
      if(this.config.provider.toLowerCase()=='bhashini') {
        if (!this.config.bhashiniUserId) {
          throw new Error('`bhashiniUserId` not defined in TRANSLATE transformer');
        }
        if (!this.config.bhashiniAPIKey) {
          throw new Error('`bhashiniAPIKey` not defined in TRANSLATE transformer');
        }
        if (!this.config.bhashiniURL) {
          throw new Error('`bhashiniURL` not defined in TRANSLATE transformer');
        }
        xmsg.payload.text = (await this.translateBhashini(
          this.config.inputLanguage,
          this.config.outputLanguage,
          xmsg?.payload?.text
        ))['translated']
        console.log("translated", xmsg.payload.text)
      } else {
        throw new Error('Azure is not configured yet in TRANSLATE transformer');
      }
      return xmsg;
    }

    async translateBhashini(
      source: string,
      target: string,
      text: string
    ) {
      try {
        let config = {
          "language": {
            "sourceLanguage": source,
            "targetLanguage": target
          }
        }
        let bhashiniConfig: any = await getBhashiniConfig(
          'translation', 
          config,
          this.config.bhashiniUserId,
          this.config.bhashiniAPIKey,
          this.config.bhashiniURL
        )
        let textArray = text.replace(/\n\n/g, "\n").split("\n")
        for (let i = 0; i < textArray.length; i++) {
          let response: any = await computeBhashini(
            bhashiniConfig?.pipelineInferenceAPIEndPoint?.inferenceApiKey?.value,
            "translation",
            bhashiniConfig?.pipelineResponseConfig[0].config[0].serviceId,
            bhashiniConfig?.pipelineInferenceAPIEndPoint?.callbackUrl,
            config,
            {
              "input": [
                {
                  "source": textArray[i]
                }
              ]
            }
          )
          if (response["error"]) {
            console.log(response["error"])
            throw new Error(response["error"])
          }
          textArray[i] = response?.pipelineResponse[0]?.output[0]?.target
        }
        return {
          translated: textArray.join('\n'),
          error: null
        }
      } catch (error) {
        console.log(error)
        return {
          translated: "",
          error: error
        }
      }
    }
    
}
