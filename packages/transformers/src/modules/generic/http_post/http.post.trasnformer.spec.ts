import { XMessage, MessageType, MessageState } from "@samagra-x/xmessage";
import { HttpPostTransformer } from "./http.post.transformer";
import fetch from 'jest-fetch-mock';

jest.mock('node-fetch', () => fetch);

describe('HttpPostTransformer', () => {
  let httpPostTransformer: HttpPostTransformer;
  let mockXMessage: XMessage;
  const eventBus = {
      pushEvent: (event: any) => {}
  }
  beforeEach(() => {
      httpPostTransformer = new HttpPostTransformer({
          url: "https://example.com/api",
          body: { key: "value" },
          headers: { "Content-Type": "application/json" },
          eventBus: eventBus
      });
      mockXMessage = {
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
  });

  test('transform method sends a POST request', async () => {
    const mockFetch: jest.Mock = jest.fn().mockResolvedValue({
        ok: true,
        headers: {
            get: (header: string) => {
                if (header.toLowerCase() === 'content-type') {
                    return 'application/json';
                }
                return null;
            }
          },
        json: () => Promise.resolve({ success: true })
    });
    global.fetch = mockFetch;
    await httpPostTransformer.transform(mockXMessage);
    expect(mockXMessage.transformer?.metaData?.httpResponse).toEqual({ success: true });
});

  test('transform method throws error on failed request', async () => {
      const mockFetch: jest.Mock = jest.fn().mockResolvedValue({
          ok: false,
          status: 404
      });
      global.fetch = mockFetch;
      await expect(httpPostTransformer.transform(mockXMessage)).rejects.toThrowError('Request failed with code: 404');
  });

  test('transform method throws error when url is not defined', async () => {

      const invalidHttpPostTransformer = new HttpPostTransformer({
          body: { key: "value" },
          headers: { "Content-Type": "application/json" },
          eventBus
      });
      await expect(invalidHttpPostTransformer.transform(mockXMessage)).rejects.toThrowError('`url` not defined in HTTP_POST transformer');
  });

  test('transform method sends a POST request without headers and body', async () => {

      const minimalHttpPostTransformer = new HttpPostTransformer({
          url: "https://example.com/api",
          eventBus
      });

      const mockFetch: jest.Mock = jest.fn().mockResolvedValue({
          ok: true,
          headers: {
            get: (header: string) => {
                if (header.toLowerCase() === 'content-type') {
                    return 'application/json';
                }
                return null;
            }
          },
          json: () => Promise.resolve({ success: true }) 
      });
      global.fetch = mockFetch;

      await minimalHttpPostTransformer.transform(mockXMessage);

      expect(mockFetch).toHaveBeenCalledWith(
          "https://example.com/api",
          expect.objectContaining({
              method: 'POST'
          })
      );
  });
});