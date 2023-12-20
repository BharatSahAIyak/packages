import { convertXMessageToMsg, convertMessageToXMsg } from './GupShupWhatsappAdapter';
import { MediaCategory, MessageState, MessageType, StylingTag, XMessage } from '@samagra-x/xmessage';
import gupshupWhatsappAdapterServiceConfig from './gupshupWhatsappAdapterServiceConfig';
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
  },
};

describe('gupshup whatsapp adapter', () => {

  let mock: MockAdapter;

  beforeAll(() => {
    mock = new MockAdapter(axios);
  })

  beforeEach(() => {
    const mockCredentials = {
      password2Way: "pass2Way",
      passwordHSM: "passHSM",
      username2Way: "9999999999",
      usernamedHSM: "9999999999",
    };
    gupshupWhatsappAdapterServiceConfig.setConfig({
      adapterCredentials: mockCredentials
    });
  })

  afterEach(() => {
    mock.reset();
  })

  it("Send Simple Text Whatsapp message", async () => {
    const mockSimpleMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockSimpleMessage.payload.text = 'Simple Message';
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=TEXT&channel=WHATSAPP&msg_id=4305161194925220864-131632492725500592&msg=Simple+Message'
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    await convertXMessageToMsg(mockSimpleMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  })

  it("Send List Options Whatsapp message", async () => {
    const mockListXMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockListXMessage.payload.stylingTag = StylingTag.LIST;
    mockListXMessage.payload.buttonChoices = [
      {key: 'option1', text: 'Option 1', backmenu: false},
      {key: 'option2', text: 'Option 2', backmenu: false},
      {key: 'option3', text: 'Option 3', backmenu: false}
    ];
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=TEXT&channel=WHATSAPP&msg_id=4305161194925220864-131632492725500592&interactive_type=list&action=%7B%22button%22%3A%22Options%22%2C%22sections%22%3A%5B%7B%22title%22%3A%22Choose+an+option%22%2C%22rows%22%3A%5B%7B%22id%22%3A%22option1%22%2C%22title%22%3A%22Option+1%22%7D%2C%7B%22id%22%3A%22option2%22%2C%22title%22%3A%22Option+2%22%7D%2C%7B%22id%22%3A%22option3%22%2C%22title%22%3A%22Option+3%22%7D%5D%7D%5D%7D&msg=Testing+bot'
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    await convertXMessageToMsg(mockListXMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  })

  it("Send Quick Button Options Whatsapp message", async () => {
    const mockListXMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockListXMessage.payload.stylingTag = StylingTag.QUICKREPLYBTN;
    mockListXMessage.payload.buttonChoices = [
      {key: 'option1', text: 'Option 1', backmenu: false},
      {key: 'option2', text: 'Option 2', backmenu: false},
      {key: 'option3', text: 'Option 3', backmenu: false}
    ];
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=TEXT&channel=WHATSAPP&msg_id=4305161194925220864-131632492725500592&interactive_type=dr_button&action=%7B%22buttons%22%3A%5B%7B%22type%22%3A%22reply%22%2C%22reply%22%3A%7B%22id%22%3A%22option1%22%2C%22title%22%3A%22Option+1%22%7D%7D%2C%7B%22type%22%3A%22reply%22%2C%22reply%22%3A%7B%22id%22%3A%22option2%22%2C%22title%22%3A%22Option+2%22%7D%7D%2C%7B%22type%22%3A%22reply%22%2C%22reply%22%3A%7B%22id%22%3A%22option3%22%2C%22title%22%3A%22Option+3%22%7D%7D%5D%7D&msg=Testing+bot'
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    await convertXMessageToMsg(mockListXMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  })

  it("Send Image Whatsapp message", async () => {
    const mockListXMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockListXMessage.payload.media = {
      category: MediaCategory.IMAGE,
      url: 'http://fakeurl.jpg',
      text: 'This is a caption'
    }
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMediaMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=IMAGE&channel=WHATSAPP&msg_id=4305161194925220864-131632492725500592&media_url=http%3A%2F%2Ffakeurl.jpg&caption=This+is+a+caption&isHSM=false'
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    await convertXMessageToMsg(mockListXMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  })

  it("Send Document Whatsapp message", async () => {
    const mockListXMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockListXMessage.payload.media = {
      category: MediaCategory.FILE,
      url: 'http://fakeurl.pdf',
      text: 'This is a caption'
    }
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMediaMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=DOCUMENT&channel=WHATSAPP&msg_id=4305161194925220864-131632492725500592&media_url=http%3A%2F%2Ffakeurl.pdf&caption=This+is+a+caption&isHSM=false'
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    await convertXMessageToMsg(mockListXMessage);
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
  //   const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=TEXT&channel=WHATSAPP&msg_id=4305161194925220864-131632492725500592&interactive_type=dr_button&action=%7B%22buttons%22%3A%5B%7B%22type%22%3A%22reply%22%2C%22reply%22%3A%7B%22id%22%3A%22option1%22%2C%22title%22%3A%22Option+1%22%7D%7D%2C%7B%22type%22%3A%22reply%22%2C%22reply%22%3A%7B%22id%22%3A%22option2%22%2C%22title%22%3A%22Option+2%22%7D%7D%2C%7B%22type%22%3A%22reply%22%2C%22reply%22%3A%7B%22id%22%3A%22option3%22%2C%22title%22%3A%22Option+3%22%7D%7D%5D%7D&msg=Testing+bot'
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
      response: "[{\"srcAddr\":\"TESTSM\",\"extra\":\"Samagra\",\"channel\":\"WHATSAPP\",\"externalId\":\"5057936233376494042-daf67a98-e3a3-4f02-8d0b-02bd41ba3aae\",\"cause\":\"SUCCESS\",\"errorCode\":\"000\",\"destAddr\":\"919999999999\",\"eventType\":\"DELIVERED\",\"eventTs\":\"1702464614000\"}]",
    }
    const expectedXMessage = {
      to: { userID: 'admin' },
      from: { userID: '9999999999' },
      channelURI: 'WhatsApp',
      providerURI: 'gupshup',
      messageState: 'DELIVERED',
      messageId: {
        channelMessageId: '5057936233376494042-daf67a98-e3a3-4f02-8d0b-02bd41ba3aae'
      },
      messageType: 'REPORT',
      timestamp: 0,
      payload: { text: '' }
    };
    const xmsg = await convertMessageToXMsg(mockReport);
    // Timestamp will be different every time, hence only
    // check for existence of field.
    expect("timestamp" in xmsg).toBeTruthy();
    xmsg.timestamp = 0;
    expect(xmsg).toStrictEqual(expectedXMessage);
  });
})
