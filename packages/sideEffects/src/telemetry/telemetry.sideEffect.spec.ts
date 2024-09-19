import { MessageState, MessageType } from "@samagra-x/xmessage";
import { TelemetrySideEffect } from "../telemetry/telemetry.sideEffect";
import fetchMock from 'fetch-mock';

const mockEvent = {
    eventName: "DEFAULT_TRANSFORMER_START_EVENT",
    transformerId: "1",
    eventData: {
      messageId: {
        Id: "00000000-0000-0000-0000-000000000000",
      },
      payload: {
        text: "pest",
        metaData: {
        },
      },
      to: {
        userID: "00000000-0000-0000-0000-000000000000",
      },
      messageType: MessageType.TEXT,
      from: { userID: "00000000-0000-0000-0000-000000000000" },
      channelURI: "Pwa",
      providerURI: "Pwa",
      timestamp: 1712576582397,
      messageState: MessageState.REPLIED,
      app: "00000000-0000-0000-0000-000000000000",
      orgId: "00000000-0000-0000-0000-000000000000",
      transformer: {
        metaData: {
          userHistory: [
          ],
          currentState: "1",
        },
      },
    },
    timestamp: 1712576582397,
};

const expectedRequest = [
    {
      "generator": "Transformer",
      "version": "0.0.1",
      "actorId": "00000000-0000-0000-0000-000000000000",
      "actorType": "System",
      "env": "UNKNOWN",
      "eventId": "E041",
      "event": "Transformer Execution",
      "subEvent": "DEFAULT_TRANSFORMER_START_EVENT",
      "eventData": {
        "botId": "00000000-0000-0000-0000-000000000000",
        "transformerId": "1",
        "orgId": "00000000-0000-0000-0000-000000000000",
        "messageId": "00000000-0000-0000-0000-000000000000"
      }
    }
];

describe(('Telemetry Side Effect Test'), () => {

    afterEach(() => fetchMock.restore());

    it('Telemetry works as expected', async () => {
        let currentRequest: any[];
        fetchMock.postOnce('http://mytesturl/metrics/v1/save', (_, req) => {
            currentRequest = JSON.parse(`${req.body}`);
            return true;
        });
        const response = await new TelemetrySideEffect({
            'host': 'http://mytesturl',
        })
        .execute({
            eventData: mockEvent.eventData,
            eventName: mockEvent.eventName,
            timestamp: mockEvent.timestamp,
            transformerId: mockEvent.transformerId,
        });
        expect(response).toBeTruthy();
        expect(currentRequest![0].timestamp);
        delete currentRequest![0].timestamp;
        expect(currentRequest!).toStrictEqual(expectedRequest);
    });

    it('Telemetry side-effect responds false in case of error', async () => {
        fetchMock.postOnce('http://mytesturl/metrics/v1/save', (_, req) => {
            throw new Error('Intentional error');
        });
        const response = await new TelemetrySideEffect({
            'host': 'http://mytesturl',
        })
        .execute({
            eventData: mockEvent.eventData,
            eventName: mockEvent.eventName,
            timestamp: mockEvent.timestamp,
            transformerId: mockEvent.transformerId,
        });
        expect(response).toBeFalsy();
    });
})
