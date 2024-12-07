import { XMessage, MessageType, MessageState } from "@samagra-x/xmessage";
import { HttpPatchTransformer } from "./http.patch.transformer";
import fetch from 'jest-fetch-mock';

jest.mock('node-fetch', () => fetch);

describe('HttpPatchTransformer', () => {
  let httpPatchTransformer: HttpPatchTransformer;
  let mockXMessage: XMessage;
  const eventBus = {
    pushEvent: (event: any) => {}
  }
  beforeEach(() => {
    httpPatchTransformer = new HttpPatchTransformer({
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

  test('transform method sends a PATCH request', async () => {
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
    await httpPatchTransformer.transform(mockXMessage);
    expect(mockXMessage.transformer?.metaData?.httpResponse).toEqual({ success: true });
  });

  test('transform method throws error on failed request', async () => {
    const mockFetch: jest.Mock = jest.fn().mockResolvedValue({
      ok: false,
      status: 404
    });
    global.fetch = mockFetch;
    await expect(httpPatchTransformer.transform(mockXMessage)).rejects.toThrowError('Request failed with code: 404');
  });

  test('transform method throws error when url is not defined', async () => {

    const invalidHttpPatchTransformer = new HttpPatchTransformer({
      body: { key: "value" },
      headers: { "Content-Type": "application/json" },
      eventBus
    });
    await expect(invalidHttpPatchTransformer.transform(mockXMessage)).rejects.toThrowError('`url` not defined in HTTP_PATCH transformer');
  });

  test('transform method sends a PATCH request without headers and body', async () => {

    const minimalHttpPatchTransformer = new HttpPatchTransformer({
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

    await minimalHttpPatchTransformer.transform(mockXMessage);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        method: 'PATCH'
      })
    );
  });
});

describe('HttpPatchTransformer Body Parsing', () => {
  let httpPatchTransformer: HttpPatchTransformer;
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
      body: { key: "direct value" },
      eventBus
    };
    httpPatchTransformer = new HttpPatchTransformer(config);

    await httpPatchTransformer.transform(mockXMessage);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        body: JSON.stringify({ key: "direct value" })
      })
    );
  });

  test('handles flat object with references in config.body', async () => {
    const config = {
      url: "https://example.com/api",
      body: {
        key1: "{{msg:payload.text}}",
        key2: "{{msg:transformer.metaData.someValue}}"
      },
      eventBus
    };
    httpPatchTransformer = new HttpPatchTransformer(config);

    await httpPatchTransformer.transform(mockXMessage);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        body: JSON.stringify({
          key1: "Testing bot",
          key2: "metadata value"
        })
      })
    );
  });

  test('handles nested object with references in config.body', async () => {
    const config = {
      url: "https://example.com/api",
      body: {
        outer: {
          inner1: "{{msg:payload.text}}",
          inner2: {
            deepValue: "{{msg:transformer.metaData.nestedValue.inner}}"
          }
        },
        flatValue: "{{msg:transformer.metaData.someValue}}"
      },
      eventBus
    };
    httpPatchTransformer = new HttpPatchTransformer(config);

    await httpPatchTransformer.transform(mockXMessage);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        body: JSON.stringify({
          outer: {
            inner1: "Testing bot",
            inner2: {
              deepValue: "nested metadata value"
            }
          },
          flatValue: "metadata value"
        })
      })
    );
  });

  test('handles mixed direct values and references in config.body', async () => {
    const config = {
      url: "https://example.com/api",
      body: {
        directValue: "This is direct",
        referencedValue: "{{msg:payload.text}}",
        nested: {
          direct: 123,
          referenced: "{{msg:transformer.metaData.someValue}}"
        }
      },
      eventBus
    };
    httpPatchTransformer = new HttpPatchTransformer(config);

    await httpPatchTransformer.transform(mockXMessage);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://example.com/api",
      expect.objectContaining({
        body: JSON.stringify({
          directValue: "This is direct",
          referencedValue: "Testing bot",
          nested: {
            direct: 123,
            referenced: "metadata value"
          }
        })
      })
    );
  });
});