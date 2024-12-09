import { Events, SideEffectData } from '../common/sideEffect.types';
import { MessageState, MessageType } from '@samagra-x/xmessage';
import { CodeRunnerSideEffect } from './codeRunner.sideEffect';

global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true, // required to simulate a successful response
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ message: 'Success' }),
      // You can also add other optional fields if necessary
    } as Response) // Cast as Response to satisfy TypeScript
  );

describe('CodeRunnerSideEffect Tests', () => {

    const mockSideEffectData: SideEffectData = {
        eventName: Events.DEFAULT_TRANSFORMER_END_EVENT,
        timestamp: 1631234567890, // Fixed timestamp for consistent testing
        transformerId: 'test-transformer',
        eventData: {
          app: 'test-bot',
          orgId: 'test-org',
          messageId: { Id: 'test-message-id' },
          from: { userID: 'test-user' },
          to: { userID: 'test-to-user' },
          payload: {
            text: 'Test payload text',
          },
          transformer: {
            metaData: {
              stateExecutionTime: 100,
              telemetryLog: 'Test log',
              responseInEnglish: 'Test response in English',
              prompt: 'Test prompt',
              streamStartLatency: 50,
              isGuided: true,
              responseType: 'text',
              isFlowEnd: false,
            },
          },
          messageType: MessageType.HSM,
          channelURI: '',
          providerURI: '',
          timestamp: 0,
          messageState: MessageState.NOT_SENT
        },
      };

    test('should return true for valid config and event data', async () => {
        const config = { code: 'return $0;' };
        const codeRunner = new CodeRunnerSideEffect(config);
        const result = await codeRunner.execute(mockSideEffectData);
        expect(result).toBe(true);
        expect(fetch).toHaveBeenCalledTimes(0);
    });

    test('should return false when config.code is missing', async () => {
        const config = {};

        const codeRunner = new CodeRunnerSideEffect(config);
        const result = await codeRunner.execute(mockSideEffectData);
        expect(result).toBe(false);
    });

    test('should return false if code throws an error', async () => {
        const config = { code: 'throw new Error("Test error");' };

        const codeRunner = new CodeRunnerSideEffect(config);
        const result = await codeRunner.execute(mockSideEffectData);
        expect(result).toBe(false);
    });

    test('should handle fetch calls correctly', async () => {
        const config = { code: '$1(`https://test.com`)'};

        const codeRunner = new CodeRunnerSideEffect(config);
        const result = await codeRunner.execute(mockSideEffectData);
        console.log('fetchresult=',result)
        expect(result).toBe(true);
        expect(fetch).toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledTimes(1);
    });

    test('should identify accepted and non-accepted events', () => {
        expect(CodeRunnerSideEffect.doesConsumeEvent('DEFAULT_TRANSFORMER_END_EVENT')).toBe(true);
        expect(CodeRunnerSideEffect.doesConsumeEvent('OTHER_EVENT')).toBe(false);
    });

});