import { GSWhatsAppMessage } from './types';
import { convertMessageToXMsg } from './GupShupWhatsappAdapter';

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
  waNumber: '1234567890',
  mobile: '9876543210',
  replyId: 'abc123',
  messageId: 'def456',
  timestamp: 1637680000,
  name: 'John Doe',
  version: 1,
  type: 'text',
  text: 'Hello, this is a mock message.',
  image: 'mock-image-url.jpg',
  document: 'mock-document-url.pdf',
  voice: 'mock-voice-url.mp3',
  audio: 'mock-audio-url.mp3',
  video: 'mock-video-url.mp4',
  location: 'mock-location-coordinates',
  response: JSON.stringify([mockGSWhatsappReport]),
  extra: 'Some extra information',
  app: 'WhatsApp',
  interactive: null,
};

describe('gupshup whatsapp adapter', () => {
  it("convert message to xmessage", async () => {
    const result = await convertMessageToXMsg(mockGSWhatsAppMessage);
    console.log("hurray", result)
  })
})