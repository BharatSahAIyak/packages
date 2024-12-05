import { XMessage, MessageType, MessageState } from "@samagra-x/xmessage";
import { HttpGetTransformer } from "./http.get.transformer";

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
    const httpGetTransformer = new HttpGetTransformer(mockConfig);
    await expect(httpGetTransformer.transform(mockXMessage)).rejects.toThrowError('`url` not defined in HTTP_GET transformer');
  });

  it('should handle GET request failure and throw an error with the failed response code', async () => {
    const mockConfig = {
      url: 'https://example.com/api',
      eventBus
    };
    const httpGetTransformer = new HttpGetTransformer(mockConfig);

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Request failed with code:'));

    await expect(httpGetTransformer.transform(mockXMessage)).rejects.toThrowError('Request failed with code:');
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

    const httpGetTransformer = new HttpGetTransformer(mockConfig);
    const expectedModifiedXMessage: XMessage = {
      ...mockXMessage,
      transformer: {
        metaData: {
          httpResponse: { key: 'value', status: 200 },
        },
      },
    };
    const transformedXMessage = await httpGetTransformer.transform(mockXMessage);
    delete transformedXMessage.transformer?.metaData?.telemetryLog;
    delete transformedXMessage.transformer?.metaData?.stateExecutionTime;
    delete transformedXMessage.transformer?.metaData?.errorString;

    await expect(transformedXMessage).toEqual(expectedModifiedXMessage);
  });
});

describe('HttpGetTransformer Headers Parsing', () => {
  let httpPostTransformer: HttpGetTransformer;
  let mockXMessage: XMessage;
  const eventBus = {
    pushEvent: (event: any) => {}
  };

  beforeEach(() => {
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
        metaData: {
          someValue: "metadata value",
          nestedValue: {
            inner: "nested metadata value"
          }
        }
      }
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => 'application/json'
      },
      json: () => Promise.resolve({ success: true })
    });
  });

  test('handles direct value in config.body', async () => {
    const config = {
      url: "https://example.com/api",
      headers: { orgId: 'uuid' },
      eventBus
    };
    httpPostTransformer = new HttpGetTransformer(config);

    await httpPostTransformer.transform(mockXMessage);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        headers: new Headers({ orgId: "uuid", "Content-Type": "application/json" })
      })
    );
  });

  test('handles flat object with references in config.body', async () => {
    const config = {
      url: "https://example.com/api",
      headers: {
        key1: "{{msg:payload.text}}",
        key2: "{{msg:transformer.metaData.someValue}}"
      },
      eventBus
    };
    httpPostTransformer = new HttpGetTransformer(config);

    await httpPostTransformer.transform(mockXMessage);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        headers: new Headers({
          key1: "Testing bot",
          key2: "metadata value", "Content-Type": "application/json"
        })
      })
    );
  });
});

describe('HttpGetTransformer Query JSON Parsing', () => {
  let httpPostTransformer: HttpGetTransformer;
  let mockXMessage: XMessage;
  const eventBus = {
    pushEvent: (event: any) => {}
  };

  beforeEach(() => {
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
        text: "Testing",
      },
      transformer: {
        metaData: {
          someValue: "metadata",
          nestedValue: {
            inner: "nested metadata value"
          }
        }
      }
    };

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => 'application/json'
      },
      json: () => Promise.resolve({ success: true })
    });
  });

  test('handles direct value in config.queryJson', async () => {
    const config = {
      url: "https://example.com/api",
      body: { key: "direct value" },
      headers: { orgId: 'uuid' },
      queryJson: { key: "direct" },
      eventBus
    };
    httpPostTransformer = new HttpGetTransformer(config);

    await httpPostTransformer.transform(mockXMessage);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/api?key=direct",
      expect.objectContaining({
        headers: new Headers({ orgId: "uuid", "Content-Type": "application/json" }),
      })
    );
  });

  test('handles flat object with references in config.body', async () => {
    const config = {
      url: "https://example.com/api",
      headers: {
        key1: "{{msg:payload.text}}",
        key2: "{{msg:transformer.metaData.someValue}}"
      },
      queryJson: {
        key1: "{{msg:payload.text}}",
        key2: "{{msg:transformer.metaData.someValue}}"
      },
      eventBus
    };
    httpPostTransformer = new HttpGetTransformer(config);

    await httpPostTransformer.transform(mockXMessage);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/api?key1=Testing&key2=metadata",
      expect.objectContaining({
        headers: new Headers({
          key1: "Testing",
          key2: "metadata", "Content-Type": "application/json"
        }),
      })
    );
  });

  test('handles references in URL', async () => {
    const config = {
      url: "https://example.com/api/{{msg:transformer.metaData.someValue}}",
      body: { key: "direct value" },
      headers: { orgId: 'uuid' },
      queryJson: { key: "direct" },
      eventBus
    };
    httpPostTransformer = new HttpGetTransformer(config);

    await httpPostTransformer.transform(mockXMessage);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/api/metadata?key=direct",
      expect.objectContaining({
        headers: new Headers({ orgId: "uuid", "Content-Type": "application/json" }),
      })
    );
  });
});