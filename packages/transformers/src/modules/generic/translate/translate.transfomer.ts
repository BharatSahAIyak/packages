import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import getBhashiniConfig from "./bhashini/bhashini.getConfig";
import computeBhashini from "./bhashini/bhashini.compute";
import computeAzure from "./azure/azure.compute";
import { Events } from "@samagra-x/uci-side-effects";
import { TelemetryLogger } from "../../common/telemetry";

export class TranslateTransformer implements ITransformer {

  /// Accepted config properties:
  ///     provider: translate service provider (Bhashini | Azure)
  ///     inputLanguage: input text language, defaults to `xmsg.transformer.metaData.inputLanguage` if null, if `xmsg.transformer.metaData.inputLanguage` is null then defaults to en
  ///     outputLanguage: output text language, defaults to `xmsg.transformer.metaData.outputLanguage` if null, if `xmsg.transformer.metaData.outputLanguage` is null then defaults to en
  ///     bhashiniUserId: user id for bhashini (required if provider is set to bhashini)
  ///     bhashiniAPIKey: API key for bhashini (required if provider is set to bhashini)
  ///     bhashiniURL: Base url for bhashini (required if provider is set to bhashini)
  constructor(readonly config: Record<string, any>) {}
  private readonly telemetryLogger = new TelemetryLogger(this.config);

  async transform(xmsg: XMessage): Promise<XMessage> {
    let startTime = ((performance.timeOrigin + performance.now()) * 1000);
    if (!this.config.inputLanguage) {
      this.config.inputLanguage = xmsg?.transformer?.metaData?.inputLanguage || 'en';
    }
    if (!this.config.outputLanguage) {
      this.config.inputLanguage = xmsg?.transformer?.metaData?.outputLanguage || 'en';
    }
    this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} translation input: ${this.config.inputLanguage} output: ${this.config.outputLanguage} started!`, startTime);
    if (!xmsg.transformer) {
      xmsg.transformer = {
        metaData: {}
      };
    }
    if (!this.config.provider) {
      this.telemetryLogger.sendErrorTelemetry(xmsg, '`provider` not defined in TRANSLATE transformer');
      throw new Error('`provider` not defined in TRANSLATE transformer');
    }
    if (!xmsg?.payload?.text) {
      this.telemetryLogger.sendErrorTelemetry(xmsg, '`input payload` not defined in TRANSLATE transformer');
      throw new Error('`input payload` not defined in TRANSLATE transformer');
    }
    console.log("TRANSLATE transformer called.", this.config.inputLanguage, this.config.outputLanguage);
    if (this.config.inputLanguage == this.config.outputLanguage) {
      return xmsg;
    }
    if (this.config.provider.toLowerCase() == 'bhashini') {
      if (!this.config.bhashiniUserId) {
        this.telemetryLogger.sendErrorTelemetry(xmsg, '`bhashiniUserId` not defined in TRANSLATE transformer');
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
    } else if (this.config.provider.toLowerCase() == 'azure') {
      if (!this.config.bhashiniURL) {
        throw new Error('`bhashiniURL` not defined in TRANSLATE transformer');
      }
      xmsg.payload.text = (await this.translateAzure(
        this.config.inputLanguage,
        this.config.outputLanguage,
        xmsg?.payload?.text,
        xmsg
      ))['translated']
    } else {
      throw new Error(`${this.config.provider.toLowerCase()} is not configured yet in TRANSLATE transformer`);
    }
    xmsg.transformer = {
      ...xmsg.transformer,
      metaData: {
        ...xmsg.transformer?.metaData,
        transalatedQuery: xmsg.payload.text
      }
    }
    this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} translation input: ${this.config.inputLanguage} output: ${this.config.outputLanguage} finished!`, startTime);
    return xmsg;
  }

  async translateAzure(
    source: string,
    target: string,
    text: string,
    xmsg: XMessage
  ) {
    try {
      let response: any = await computeAzure({
        sourceLanguage: source,
        targetLanguage: target,
        text,
        botId: xmsg.app,
        orgId: xmsg.orgId
      }, this.config.bhashiniURL);
      return {
        translated: response.translated,
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
