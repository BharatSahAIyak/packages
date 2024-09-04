import { BroadcastTransformer } from './broadcast.transformer';
import { XMessage, MediaCategory, MessageState, MessageType } from '@samagra-x/xmessage';
import { TelemetryLogger } from '../../common/telemetry';

jest.mock('../../common/telemetry');

describe('BroadcastTransformer', () => {
    let transformer: BroadcastTransformer;
    let mockConfig: Record<string, any>;
    let mockXMessage: XMessage;

    beforeEach(() => {
        mockConfig = {
            transformerId: 'testTransformer',
            title: 'Test Title',
            body: 'Test Body',
            image: 'http://example.com/image.jpg',
            icon: 'http://example.com/icon.jpg',
            deeplink: 'http://example.com/deeplink'
        };
        transformer = new BroadcastTransformer(mockConfig);
        mockXMessage = {
            to: {
              userID: "XXXXXX",
            },
            from: {
              userID: "mockUserId",
              deviceID: "FCM-Token"
            },
            channelURI: "Whatsapp",
            providerURI: "Gupshup",
            messageState: MessageState.ENQUEUED,
            messageId: {
              Id: "00000000-0000-0000-0000-000000000000",
            },
            messageType: MessageType.BROADCAST,
            timestamp: 1715602492000,
            payload: {
              text: "Hello testing",
            },
            adapterId: "11111111-1111-1111-1111-111111111111",
            app: "22222222-2222-2222-222222222222",
            ownerId: "33333333-3333-3333-333333333333",
            orgId: "44444444-4444-4444-444444444444",
            transformer: {
             
            }
        };
    });

    it('should log the start and end of the transformation', async () => {
        const sendLogTelemetrySpy = jest.spyOn(transformer['telemetryLogger'], 'sendLogTelemetry');

        await transformer.transform(mockXMessage);

        expect(sendLogTelemetrySpy).toHaveBeenCalledWith(mockXMessage, `${mockConfig.transformerId} started!`, expect.any(Number));
        expect(sendLogTelemetrySpy).toHaveBeenCalledWith(mockXMessage, `${mockConfig.transformerId} finished!`, expect.any(Number));
    });

    it('should transform the xmsg object correctly', async () => {
        const transformedXMessage = await transformer.transform(mockXMessage);

        expect(transformedXMessage.payload.subject).toBe(mockConfig.title);
        expect(transformedXMessage.payload.text).toBe(mockConfig.body);
        expect(transformedXMessage.payload.media).toEqual([
            {
                url: mockConfig.image,
                category: MediaCategory.IMAGE_URL,
                caption: 'Image'
            },
            {
                url: mockConfig.icon,
                category: MediaCategory.IMAGE_URL,
                caption: 'Icon_Image'
            }
        ]);
        expect(transformedXMessage.payload.metaData).toEqual({
            deeplink: mockConfig.deeplink
        });
    });
});