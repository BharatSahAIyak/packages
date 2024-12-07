import { GupshupWhatsappProvider, IGSWhatsappConfig } from './GupShupWhatsappAdapter';
import { MediaCategory, MessageState, MessageType, XMessage } from '@samagra-x/xmessage';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

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

describe('Gupshup Whatsapp adapter v2', () => {

  let mock: MockAdapter;
  let adapter: GupshupWhatsappProvider;

  beforeAll(() => {
    mock = new MockAdapter(axios);
  });

  beforeEach(() => {
    const mockCredentials: IGSWhatsappConfig = {
      password2Way: "pass2Way",
      passwordHSM: "passHSM",
      username2Way: "9999999999",
      usernameHSM: "9999999999",
    };

    adapter = new GupshupWhatsappProvider(mockCredentials);
  });

  afterEach(() => {
    mock.reset();
  });

  it("Send Simple Text Whatsapp message", async () => {
    const mockSimpleMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockSimpleMessage.payload.text = 'Simple Message';
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=TEXT&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&msg=Simple+Message';
    
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      console.log('Full URL being hit:', config.url); // Added log for full URL
      return [200, { response: { status: 'success' } }];
    });
    
    await adapter.sendMessage(mockSimpleMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  });

  it("Send Image Whatsapp message", async () => {
    const mockImageMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockImageMessage.messageType = MessageType.IMAGE;
    mockImageMessage.payload.media = [{
      url: "https://example.com/image.jpg",
      category: MediaCategory.IMAGE,
      mimeType: 'image/jpeg'
    }];
    
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMediaMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=IMAGE&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&msg=Testing+bot&media_url=https%3A%2F%2Fexample.com%2Fimage.jpg&isHSM=false';
    
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    
    await adapter.sendMessage(mockImageMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  });

  it("Handles failure when message is not sent", async () => {
    const mockSimpleMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockSimpleMessage.payload.text = 'Failure Message';
    
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'failure', details: 'Some error' } }];
    });
    
    const result = await adapter.sendMessage(mockSimpleMessage);
    
    // Ensure result is defined before accessing its properties
    expect(result).toBeDefined();
    expect(result?.messageState).toBe(MessageState.NOT_SENT);
  });

  it("Send message with Quick Reply Payloads", async () => {
    const mockQRMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockQRMessage.payload = {
      ...mockQRMessage.payload,
      text: 'Message with quick replies',
      metaData: {
        qrPayload: {
          '1': 'payload1',
          '2': 'payload2'
        }
      }
    };
    
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMessage&userid=9999999999&password=pass2Way&isTemplate=true&qrPayload_1=payload1&qrPayload_2=payload2&send_to=919999999999&phone_number=919999999999&msg_type=TEXT&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&msg=Message+with+quick+replies';
    
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    
    await adapter.sendMessage(mockQRMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  });

  it("Send message with CTA Button URL", async () => {
    const mockButtonMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockButtonMessage.payload = {
      ...mockButtonMessage.payload,
      text: 'Message with CTA button',
      metaData: {
        ctaButtonUrl: 'https://example.com/action'
      }
    };
    
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMessage&userid=9999999999&password=pass2Way&cta_button_url=https%3A%2F%2Fexample.com%2Faction&send_to=919999999999&phone_number=919999999999&msg_type=TEXT&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&msg=Message+with+CTA+button';
    
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    
    await adapter.sendMessage(mockButtonMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  });

  it("Send message with Campaign Tracking", async () => {
    const mockCampaignMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockCampaignMessage.payload = {
      ...mockCampaignMessage.payload,
      text: 'Campaign message',
      metaData: {
        campaignId: 'CAMPAIGN_123'
      }
    };
    
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=CAMPAIGN_123&data_encoding=text&messageId=123456789&method=SendMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=TEXT&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&msg=Campaign+message';
    
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    
    await adapter.sendMessage(mockCampaignMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  });

  it("Send media message with caption", async () => {
    const mockCaptionMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockCaptionMessage.messageType = MessageType.IMAGE;
    mockCaptionMessage.payload.media = [{
      url: "https://example.com/image.jpg",
      category: MediaCategory.IMAGE,
      mimeType: 'image/jpeg',
      caption: "Image caption text"
    }];
    
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMediaMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=IMAGE&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&msg=Testing+bot&media_url=https%3A%2F%2Fexample.com%2Fimage.jpg&isHSM=false&caption=Image+caption+text';
    
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    
    await adapter.sendMessage(mockCaptionMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  });

  it("Send media message with quick reply and CTA button", async () => {
    const mockMediaQRMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockMediaQRMessage.messageType = MessageType.IMAGE;
    mockMediaQRMessage.payload = {
      ...mockMediaQRMessage.payload,
      media: [{
        url: "https://example.com/image.jpg",
        category: MediaCategory.IMAGE,
        mimeType: 'image/jpeg',
        caption: "Image with quick reply"
      }],
      metaData: {
        qrPayload: {
          '1': 'payload1',
          '2': 'payload2'
        },
        ctaButtonUrl: 'https://example.com/action'
      }
    };
    
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMediaMessage&userid=9999999999&password=pass2Way&isTemplate=true&qrPayload_1=payload1&qrPayload_2=payload2&cta_button_url=https%3A%2F%2Fexample.com%2Faction&send_to=919999999999&phone_number=919999999999&msg_type=IMAGE&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&msg=Testing+bot&media_url=https%3A%2F%2Fexample.com%2Fimage.jpg&isHSM=false&caption=Image+with+quick+reply';
    
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    
    await adapter.sendMessage(mockMediaQRMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  });

  it("Send document with campaign tracking", async () => {
    const mockDocMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockDocMessage.messageType = MessageType.DOCUMENT;
    mockDocMessage.payload = {
      ...mockDocMessage.payload,
      media: [{
        url: "http://example.com/document.pdf",
        category: MediaCategory.FILE,
        mimeType: 'application/pdf',
        caption: "Document with tracking"
      }],
      metaData: {
        campaignId: 'DOC_CAMPAIGN_123'
      }
    };
    
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=DOC_CAMPAIGN_123&data_encoding=text&messageId=123456789&method=SendMediaMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=DOCUMENT&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&msg=Testing+bot&media_url=http%3A%2F%2Fexample.com%2Fdocument.pdf&isHSM=false&caption=Document+with+tracking';
    
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    
    await adapter.sendMessage(mockDocMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  });

  it("Send video with button URL parameter", async () => {
    const mockVideoMessage: XMessage = JSON.parse(JSON.stringify(baseMockXMessage));
    mockVideoMessage.messageType = MessageType.VIDEO;
    mockVideoMessage.payload = {
      ...mockVideoMessage.payload,
      media: [{
        url: "http://example.com/video.mp4",
        category: MediaCategory.VIDEO,
        mimeType: 'video/mp4',
        caption: "Video with button"
      }],
      metaData: {
        buttonUrlParam: 'https://example.com/track'
      }
    };
    
    const expectedParameters = 'v=1.1&format=json&auth_scheme=plain&extra=Samagra&data_encoding=text&messageId=123456789&method=SendMediaMessage&userid=9999999999&password=pass2Way&send_to=919999999999&phone_number=919999999999&msg_type=VIDEO&channel=Whatsapp&msg_id=4305161194925220864-131632492725500592&msg=Testing+bot&media_url=http%3A%2F%2Fexample.com%2Fvideo.mp4&isHSM=false&buttonUrlParam=https%3A%2F%2Fexample.com%2Ftrack&caption=Video+with+button';
    
    const urlRegex = /^https:\/\/media\.smsgupshup\.com\/GatewayAPI\/rest\?(.*)$/;
    let actualParametersPassed: string | undefined = '';
    
    mock.onGet(urlRegex).reply(config => {
      actualParametersPassed = (config.url?.match(urlRegex) ?? [])[1];
      return [200, { response: { status: 'success' } }];
    });
    
    await adapter.sendMessage(mockVideoMessage);
    expect(actualParametersPassed).toBe(expectedParameters);
  });

});
