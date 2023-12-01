import { GSWhatsAppMessage } from './types';
import { convertMessageToXMsg, convertXMessageToMsg } from './GupShupWhatsappAdapter';
import { MessageState, MessageType, XMessage } from '@samagra-x/xmessage';
import gupshupWhatsappAdapterServiceConfig from './gupshupWhatsappAdapterServiceConfig';

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

const mockGSWhatsAppMessage: GSWhatsAppMessage = { 
  mobile: "917011854675", 
  type: "text",
  // location: '{"longitude":123.456,"latitude":78.91}',
  text: "Hello", 
  timestamp: "1700828617000", 
  waNumber: "919311415687", 
  name: "Kanav Dwevedi" 
};

const mockXMessage: XMessage = {
  adapterId: '44a9df72-3d7a-4ece-94c5-98cf26307324',
  to: { userID: '7011854675' },
  from: { userID: 'admin' },
  channelURI: 'WhatsApp',
  providerURI: 'gupshup',
  messageState: MessageState.OPTED_IN,
  messageId: {
    channelMessageId: '4464978828693922816-105308573296985680',
    replyId: ''
  },
  messageType: MessageType.HSM,
  timestamp: 1700828617000,
  payload: { text: 'Hello' }
}

describe('gupshup whatsapp adapter', () => {
  gupshupWhatsappAdapterServiceConfig.setConfig({
    baseUrl: '',
    adminToken: '',
    vaultServiceToken: '',
    vaultServiceUrl: '',
    gupshupUrl: 'https://media.smsgupshup.com/GatewayAPI/rest'
  })
  it("convert messages", async () => {
    const message = await convertXMessageToMsg(mockXMessage);
    console.log("converted Message:", message);
    // const xmessage = await convertMessageToXMsg(mockGSWhatsAppMessage);
    // console.log("converted XMessage:", xmessage);
  })
})