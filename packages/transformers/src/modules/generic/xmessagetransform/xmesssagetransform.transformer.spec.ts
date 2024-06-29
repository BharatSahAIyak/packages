

import { XMessage, MessageType, MessageState } from "@samagra-x/xmessage";
import { XMessageTransform } from "./xmessagetransform.transformer";

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
            metaData: {
              myProperty1: 'modifiedMessage'
            }
          }
      };
      const eventBus = {
        pushEvent: (event: any) => {}
      }
      const mockConfig = {
          rawData: {
              replacements : {
                  text: {
                      value: "{{msg:payload.text}}",
                  },
                  
              }
          }
        };

describe('XMessageTransform', () => {
        
        it('should modify the XMessage accordingly', async () => {
            const xMessageTransform = new XMessageTransform(mockConfig);
            const modifiedXMessage = await xMessageTransform.transform(mockXMessage);
            expect(modifiedXMessage.payload.text).toBe('Testing bot');
        });
    
        it('should throw an error if config.rawData is not provided', async () => {
            const mockConfig = {eventBus}; // Missing rawData property
            const xMessageTransform = new XMessageTransform(mockConfig);
            await expect(xMessageTransform.transform(mockXMessage)).rejects.toThrow('config.rawData is required');
    
        });
    });