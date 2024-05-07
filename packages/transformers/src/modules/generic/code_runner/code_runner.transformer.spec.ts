import { XMessage, MessageType, MessageState } from "@samagra-x/xmessage";
import { CodeRunnerTransformer } from "./code_runner.transformer";

        const mockXMessage: XMessage = {
          messageType: MessageType.TEXT,
          messageId: {
            Id: "4305161194925220864-131632492725500592",
            channelMessageId: "4305161194925220864-131632492725500592",
          },
          to: {
            userID: "9999999999",
          },
          from: {
            userID: "admin",
            bot: true,
            meta: new Map(Object.entries({
              botMobileNumber: "919999999999",
            })),
          },
          channelURI: "",
          providerURI: "",
          timestamp: 4825,
          messageState: MessageState.REPLIED,
          payload: {
            text: "Testing bot",
          },
          transformer: {
            metaData: {}
          }
      };
      const eventBus = {
        pushEvent: (event: any) => {}
      }
      const mockConfig = {
          code: `
              const msg = JSON.parse($0);
              msg.payload.text = 'modifiedMessage';
              msg.transformer.metaData.additionalKey = 'additionalValue';
              return JSON.stringify(msg);
          `,
          eventBus
      };

describe('CodeRunnerTransformer', () => {
    
    it('should execute the provided code and modify XMessage accordingly', async () => {
        const codeRunnerTransformer = new CodeRunnerTransformer(mockConfig);
        const modifiedXMessage = await codeRunnerTransformer.transform(mockXMessage);
        expect(modifiedXMessage.payload.text).toBe('modifiedMessage');
        expect(modifiedXMessage.transformer?.metaData?.additionalKey).toBe('additionalValue');
    });

    it('should throw an error if config.code is not provided', async () => {
        const mockConfig = {eventBus}; // Missing code property
        const codeRunnerTransformer = new CodeRunnerTransformer(mockConfig);
        await expect(codeRunnerTransformer.transform(mockXMessage)).rejects.toThrow('config.code is required');

    });

    it('should handle code execution error and maintain original XMessage', async () => {
      const mockConfig = {
          code: `throw new Error('Test error');`,
          eventBus
      };
      const codeRunnerTransformer = new CodeRunnerTransformer(mockConfig);
      const logSpy = jest.spyOn(console, 'log');
      await expect(codeRunnerTransformer.transform(mockXMessage)).rejects.toThrowError('Test error');
      logSpy.mockRestore();
    });
    
    it('should handle malformed JSON returned by code and maintain original XMessage', async () => {
      const mockConfig = {
          code: `return 'malformed JSON';`,
          eventBus
      };
      const codeRunnerTransformer = new CodeRunnerTransformer(mockConfig);
  
      await expect(codeRunnerTransformer.transform(mockXMessage)).rejects.toThrow();
    });  

});
