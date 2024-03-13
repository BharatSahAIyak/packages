import { XMessage, MessageType, MessageState } from "@samagra-x/xmessage";
import { HttpGetTransformer } from "./http.get.transformer";
import fetch from 'jest-fetch-mock';

jest.mock('node-fetch', () => fetch);

class MockResponse {
  json = jest.fn().mockResolvedValue({ key: 'value', status: 200 });
  ok = true;
}

describe('HttpGetTransformer', () => {
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
      };

  beforeEach(() => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new MockResponse() as unknown as Response);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error when `url` is not defined in config', async () => {
    const mockConfig = {
      query: '?param=value',
      headers: { 'Authorization': 'Bearer TOKEN' },
    };
    const httpGetTransformer = new HttpGetTransformer(mockConfig);
    await expect(httpGetTransformer.transform(mockXMessage)).rejects.toThrowError('`url` not defined in HTTP_GET transformer');
  });

  it('should handle GET request failure and throw an error with the failed response code', async () => {
      const mockConfig = {
          url: 'https://example.com/api',
      };
      const httpGetTransformer = new HttpGetTransformer(mockConfig);
      fetch.mockRejectOnce();
      try {
          await httpGetTransformer.transform(mockXMessage);
      } catch (error) {
          expect((error as Error).message).toContain('Request failed with code:');
      }
  });

  it('should transform XMessage with valid config', async () => {
    const mockConfig = {
      url: 'https://www.google.com/',
      query: '?param=value',
      headers: { 'Authorization': 'Bearer TOKEN' },
    };

    const httpGetTransformer = new HttpGetTransformer(mockConfig);
    const expectedModifiedXMessage: XMessage = {
      ...mockXMessage,
      transformer: {
        metaData: {
          httpResponse: { key: 'value', status: 200 },
        },
      },
    };
    await expect(httpGetTransformer.transform(mockXMessage)).resolves.toEqual(expectedModifiedXMessage);
  });
});
