import { XMessage, MessageType, MessageState } from "@samagra-x/xmessage";
import { HttpDeleteTransformer } from "./http.delete.transformer";

describe('HttpDeleteTransformer', () => {
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

  beforeEach(() => {
    global.fetch = jest.fn() as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should throw an error when `url` is not defined in config', async () => {
    const mockConfig = {
      query: '?param=value',
      headers: { 'Authorization': 'Bearer TOKEN' },
      eventBus
    };
    const httpDeleteTransformer = new HttpDeleteTransformer(mockConfig);
    await expect(httpDeleteTransformer.transform(mockXMessage)).rejects.toThrowError('`url` not defined in HTTP_DELETE transformer');
  });

  it('should handle GET request failure and throw an error with the failed response code', async () => {
    const mockConfig = {
      url: 'https://example.com/api',
      eventBus
    };
    const httpDeleteTransformer = new HttpDeleteTransformer(mockConfig);

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Request failed with code:'));

    await expect(httpDeleteTransformer.transform(mockXMessage)).rejects.toThrowError('Request failed with code:');
  });

  it('should transform XMessage with valid config', async () => {

    const mockResponse = { key: 'value', status: 200 };
    const mockJsonPromise = Promise.resolve(mockResponse);
    const mockFetchPromise = Promise.resolve({
      ok: true,
      json: () => mockJsonPromise,
      headers: {
        get: () => 'application/json',
      }
    });

    (global.fetch as jest.Mock).mockImplementation(() => mockFetchPromise);

    const mockConfig = {
      url: 'https://www.google.com/',
      query: '?param=value',
      headers: { 'Authorization': 'Bearer TOKEN' },
      eventBus
    };

    const httpDeleteTransformer = new HttpDeleteTransformer(mockConfig);
    const expectedModifiedXMessage: XMessage = {
      ...mockXMessage,
      transformer: {
        metaData: {
          "eventId": "TE-120",
          httpResponse: { key: 'value', status: 200 },
        },
      },
    };
    const transformedXMessage = await httpDeleteTransformer.transform(mockXMessage);
    delete transformedXMessage.transformer?.metaData?.telemetryLog;
    delete transformedXMessage.transformer?.metaData?.stateExecutionTime;
    delete transformedXMessage.transformer?.metaData?.errorString;

    await expect(transformedXMessage).toEqual(expectedModifiedXMessage);
  });
});