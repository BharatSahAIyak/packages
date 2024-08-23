import { GupshupWhatsappProvider, IGSWhatsappConfig } from './GupShupWhatsappAdapter';
import { MediaCategory, MessageState, MessageType, StylingTag, XMessage } from '@samagra-x/xmessage';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

const mockGSWhatsappReport = {
  externalId: 'report-123',
  eventType: 'SENT',
  eventTs: '2023-11-23T12:00:00Z',
  destAddr: 'destination-address',
  srcAddr: 'source-address',
  cause: 'no-error',
  errorCode: '0',
  channel: 'whatsapp',
  extra: 'Some extra information for the report',
};

const baseMockXMessage: XMessage = {
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
    buttonChoices: {
      choices: []
    }
  },
};

describe('gupshup whatsapp adapter', () => {

  let mock: MockAdapter;
  let adapter: GupshupWhatsappProvider;

  beforeAll(() => {
    mock = new MockAdapter(axios);
  })

  beforeEach(() => {
    const mockCredentials: IGSWhatsappConfig  = {
      password2Way: "pass2Way",
      passwordHSM: "passHSM",
      username2Way: "9999999999",
      usernameHSM: "9999999999",
    };

    adapter = new GupshupWhatsappProvider(mockCredentials);
  })

  afterEach(() => {
    mock.reset();
  })

  it("Send Simple Text Whatsapp message", async () => {
    const mockSimpleMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockSimpleMessage.payload.text = 'Simple Message';
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=TEXT&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&msg=Simple+Message'
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    await adapter.sendMessage(mockSimpleMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  })

  it("Send List Options Whatsapp message", async () => {
    const mockListXMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockListXMessage.payload.stylingTag = StylingTag.LIST;
    mockListXMessage.payload.buttonChoices!.choices = [
      {key: 'option1', text: 'Option 1'},
      {key: 'option2', text: 'Option 2'},
      {key: 'option3', text: 'Option 3'}
    ];
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=TEXT&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&interactive_type=list&action=%7B%22button%22%3A%22Options%22%2C%22sections%22%3A%5B%7B%22title%22%3A%22Choose+an+option%22%2C%22rows%22%3A%5B%7B%22id%22%3A%22option1%22%2C%22title%22%3A%22Option+1%22%7D%2C%7B%22id%22%3A%22option2%22%2C%22title%22%3A%22Option+2%22%7D%2C%7B%22id%22%3A%22option3%22%2C%22title%22%3A%22Option+3%22%7D%5D%7D%5D%7D&msg=Testing+bot'
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    await adapter.sendMessage(mockListXMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  })

  it("Send Quick Button Options Whatsapp message", async () => {
    const mockListXMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockListXMessage.payload.stylingTag = StylingTag.QUICKREPLYBTN;
    mockListXMessage.payload.buttonChoices!.choices = [
      {key: 'option1', text: 'Option 1'},
      {key: 'option2', text: 'Option 2'},
      {key: 'option3', text: 'Option 3'}
    ];
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=TEXT&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&interactive_type=dr_button&action=%7B%22buttons%22%3A%5B%7B%22type%22%3A%22reply%22%2C%22reply%22%3A%7B%22id%22%3A%22option1%22%2C%22title%22%3A%22Option+1%22%7D%7D%2C%7B%22type%22%3A%22reply%22%2C%22reply%22%3A%7B%22id%22%3A%22option2%22%2C%22title%22%3A%22Option+2%22%7D%7D%2C%7B%22type%22%3A%22reply%22%2C%22reply%22%3A%7B%22id%22%3A%22option3%22%2C%22title%22%3A%22Option+3%22%7D%7D%5D%7D&msg=Testing+bot'
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    await adapter.sendMessage(mockListXMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  })

  it("Send Image Whatsapp message", async () => {
    const mockListXMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockListXMessage.payload.media = [
      {
        category: MediaCategory.IMAGE,
        url: 'http://fakeurl.jpg',
        caption: 'This is a caption'
      }
    ];
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMediaMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=IMAGE&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&media_url=http%3A%2F%2Ffakeurl.jpg&caption=This+is+a+caption&isHSM=false'
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    await adapter.sendMessage(mockListXMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  })

  it("Send Document Whatsapp message", async () => {
    const mockListXMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockListXMessage.payload.media = [
      {
        category: MediaCategory.FILE,
        url: 'http://fakeurl.pdf',
        caption: 'This is a caption'
      }
    ];
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMediaMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=DOCUMENT&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&media_url=http%3A%2F%2Ffakeurl.pdf&caption=This+is+a+caption&isHSM=false'
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    await adapter.sendMessage(mockListXMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  })

  // TODO: Not Working, fix this when HSM template is working.
  // it("Send HSM Whatsapp message", async () => {
  //   const mockListXMessage: XMessage = JSON.parse(JSON.stringify(originalMockXMessage));
  //   // mockListXMessage.payload.media = {
  //   //   category: MediaCategory.VIDEO,
  //   //   url: '3sFftGeO3jT3HOoAvkbfO8Gkt_rQl3DrjwCO7jQF_0WwWCUC6PPpDo9JHBkObP7xBw7eIEcIF797AtW1jkM',
  //   //   text: 'caption'
  //   // }
  //   mockListXMessage.messageType = MessageType.HSM;
  //   const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=TEXT&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&interactive_type=dr_button&action=%7B%22buttons%22%3A%5B%7B%22type%22%3A%22reply%22%2C%22reply%22%3A%7B%22id%22%3A%22option1%22%2C%22title%22%3A%22Option+1%22%7D%7D%2C%7B%22type%22%3A%22reply%22%2C%22reply%22%3A%7B%22id%22%3A%22option2%22%2C%22title%22%3A%22Option+2%22%7D%7D%2C%7B%22type%22%3A%22reply%22%2C%22reply%22%3A%7B%22id%22%3A%22option3%22%2C%22title%22%3A%22Option+3%22%7D%7D%5D%7D&msg=Testing+bot'
  //   const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
  //   let actualParametersPassed: string | undefined = '';
  //   // mock.onGet(urlRegex).reply(config => {
  //   //   actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
  //   //   return [200, { response: { status: 'success' } }];
  //   // });
  //   await convertXMessageToMsg(mockListXMessage);
  //   expect(actualParametersPassed).toBe(expectedParameters);
  // })

  it ("Convert whatsapp report to XMessage", async () => {
    const mockReport = {
      response: "[{\"srcAddr\":\"TESTSM\",\"extra\":\"Samagra\",\"channel\":\"Whatsapp\",\"externalId\":\"5057936233376494042-daf67a98-e3a3-4f02-8d0b-02bd41ba3aae\",\"cause\":\"SUCCESS\",\"errorCode\":\"000\",\"destAddr\":\"919999999999\",\"eventType\":\"DELIVERED\",\"eventTs\":\"1702464614000\"}]",
    }
    const expectedXMessage = {
      to: { userID: 'admin' },
      from: { userID: '9999999999' },
      channelURI: 'Whatsapp',
      providerURI: 'Gupshup',
      messageState: 'DELIVERED',
      messageId: {
        Id: 'testId',
      },
      messageType: 'REPORT',
      timestamp: 0,
      payload: { text: '' }
    };
    const xmsg = await adapter.convertMessageToXMsg(mockReport);
    // Timestamp will be different every time, hence only
    // check for existence of field.
    expect("timestamp" in xmsg).toBeTruthy();
    expect(xmsg.messageId.Id).toBeDefined();
    xmsg.timestamp = 0;
    xmsg.messageId.Id = 'testId';
    expect(xmsg).toStrictEqual(expectedXMessage);
  });

  it("Convert Whatsapp Audio message to XMessage", async () => {
    const mockAudioMessage = {
      "mobile": "919999999999",
      "type": "audio",
      "audio": "{\"signature\":\"xyz\",\"mime_type\":\"audio/ogg; codecs=opus\",\"url\":\"baseurl?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240514T101323Z&X-Amz-SignedHeaders=host&X-Amz-Expires=172800&X-Amz-Credential=cred&X-Amz-Signature=\"}",
      "timestamp": "1715681599000",
      "waNumber": "918888888888",
      "name": "User"
    };
    const expectedXMessage: XMessage = {
      to: { userID: 'admin' },
      from: { userID: '9999999999' },
      channelURI: 'Whatsapp',
      providerURI: 'Gupshup',
      messageState: MessageState.REPLIED,
      messageId: {
        Id: 'testId',
      },
      messageType: MessageType.AUDIO,
      timestamp: 0,
      payload: {
        text: "",
        media: [
          {
            category: MediaCategory.AUDIO,
            url: 'baseurl?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240514T101323Z&X-Amz-SignedHeaders=host&X-Amz-Expires=172800&X-Amz-Credential=cred&X-Amz-Signature=xyz',
            mimeType: 'audio/ogg; codecs=opus',
          }
        ]
      }
    };
    const xmsg = await adapter.convertMessageToXMsg(mockAudioMessage);
    expect(xmsg.messageId.Id).toBeDefined();
    xmsg.messageId.Id = 'testId';
    expect(xmsg.timestamp).toBeGreaterThan(0);
    xmsg.timestamp = 0;
    expect(xmsg).toStrictEqual(expectedXMessage);
  });

  it("Convert Whatsapp Video message to XMessage", async () => {
    const mockAudioMessage = {
      "mobile": "919999999999",
      "type": "video",
      "video": "{\"signature\":\"xyz\",\"mime_type\":\"video/mp4\",\"url\":\"baseurl?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240514T101323Z&X-Amz-SignedHeaders=host&X-Amz-Expires=172800&X-Amz-Credential=cred&X-Amz-Signature=\"}",
      "timestamp": "1715681599000",
      "waNumber": "918888888888",
      "name": "User"
    };
    const expectedXMessage: XMessage = {
      to: { userID: 'admin' },
      from: { userID: '9999999999' },
      channelURI: 'Whatsapp',
      providerURI: 'Gupshup',
      messageState: MessageState.REPLIED,
      messageId: {
        Id: 'testId',
      },
      messageType: MessageType.VIDEO,
      timestamp: 0,
      payload: {
        text: "",
        media: [
          {
            category: MediaCategory.VIDEO,
            url: 'baseurl?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240514T101323Z&X-Amz-SignedHeaders=host&X-Amz-Expires=172800&X-Amz-Credential=cred&X-Amz-Signature=xyz',
            mimeType: 'video/mp4',
          }
        ]
      }
    };
    const xmsg = await adapter.convertMessageToXMsg(mockAudioMessage);
    expect(xmsg.messageId.Id).toBeDefined();
    xmsg.messageId.Id = 'testId';
    expect(xmsg.timestamp).toBeGreaterThan(0);
    xmsg.timestamp = 0;
    expect(xmsg).toStrictEqual(expectedXMessage);
  });

  it("Convert Whatsapp Image message to XMessage", async () => {
    const mockAudioMessage = {
      "mobile": "919999999999",
      "type": "image",
      "image": "{\"signature\":\"xyz\",\"mime_type\":\"image/jpeg\",\"url\":\"baseurl?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240514T101323Z&X-Amz-SignedHeaders=host&X-Amz-Expires=172800&X-Amz-Credential=cred&X-Amz-Signature=\"}",
      "timestamp": "1715681599000",
      "waNumber": "918888888888",
      "name": "User"
    };
    const expectedXMessage: XMessage = {
      to: { userID: 'admin' },
      from: { userID: '9999999999' },
      channelURI: 'Whatsapp',
      providerURI: 'Gupshup',
      messageState: MessageState.REPLIED,
      messageId: {
        Id: 'testId',
      },
      messageType: MessageType.IMAGE,
      timestamp: 0,
      payload: {
        text: "",
        media: [
          {
            category: MediaCategory.IMAGE,
            url: 'baseurl?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240514T101323Z&X-Amz-SignedHeaders=host&X-Amz-Expires=172800&X-Amz-Credential=cred&X-Amz-Signature=xyz',
            mimeType: 'image/jpeg',
          }
        ]
      }
    };
    const xmsg = await adapter.convertMessageToXMsg(mockAudioMessage);
    expect(xmsg.messageId.Id).toBeDefined();
    xmsg.messageId.Id = 'testId';
    expect(xmsg.timestamp).toBeGreaterThan(0);
    xmsg.timestamp = 0;
    xmsg.messageId.Id = 'testId';
    expect(xmsg).toStrictEqual(expectedXMessage);
  });
});

describe('GupshupWhatsappProvider location message tests', () => {
  let axiosGetSpy: jest.SpyInstance;

  const mockCredentials: IGSWhatsappConfig = {
    password2Way: "pass2Way",
    passwordHSM: "passHSM",
    username2Way: "9999999999",
    usernameHSM: "9999999999",
  };

  const setupMockLocationMessage = (overrides = {}): XMessage => {
    const mockLocationMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockLocationMessage.payload.location = {
      longitude: 77.594566,
      latitude: 12.9715987,
      name: "Test Location",
      address: "123 Test Address",
      url: 'https://sample.com',
      ...overrides,
    };
    return mockLocationMessage;
  };

  beforeAll(() => {
    axiosGetSpy = jest.spyOn(axios, 'get').mockResolvedValue({ data: mockGSWhatsappReport });
  });

  afterAll(() => {
    axiosGetSpy.mockRestore();
  });

  it('should send location message successfully', async () => {
    const adapter = new GupshupWhatsappProvider(mockCredentials);
    const mockLocationMessage = setupMockLocationMessage();

    const expectedUrl = `https://media.smsgupshup.com/GatewayAPI/rest?method=SendMessage&msg_type=LOCATION&userid=9999999999&password=pass2Way&send_to=9999999999&location=%7B%22longitude%22%3A%2277.594566%22%2C%22latitude%22%3A%2212.9715987%22%2C%22name%22%3A%22Test+Location%22%2C%22address%22%3A%22123+Test+Address%22%2C%22url%22%3A%22https%3A%2F%2Fsample.com%22%7D`;

    await adapter.sendLocationMessage(mockLocationMessage);

    expect(axios.get).toHaveBeenCalledWith(expectedUrl);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });

  it('should throw an error if location parameters are missing', async () => {
    const adapter = new GupshupWhatsappProvider(mockCredentials);
    const mockLocationMessage = setupMockLocationMessage({
      name: "",
      address: "",
      latitude: null,
      longitude: null,
      url: ""
    });

    await expect(adapter.sendLocationMessage(mockLocationMessage)).rejects.toThrow('Missing location parameters for sending location message');
  });
});
