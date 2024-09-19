import { Events, SideEffectData } from '../common/sideEffect.types';
import { MessageState, MessageType } from '@samagra-x/xmessage';
import { CodeRunnerSideEffect } from './codeRunner.sideEffect';

// Mock fetch globally
global.fetch = jest.fn();

describe('CodeRunnerSideEffect Tests', () => {

    let fetchMock: jest.SpyInstance;

    beforeEach(() => {
        // Spy on global fetch and mock its implementation
        fetchMock = jest.spyOn(global, 'fetch').mockImplementation(() =>
            Promise.resolve({
                json: () => Promise.resolve('response'),
                text: () => Promise.resolve('response')
            }) as unknown as Promise<Response>
        );
    });

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
        const config = { code: 'return JSON.parse(arguments[0]).eventData.payload;' };

        const codeRunner = new CodeRunnerSideEffect(config);
        const result = await codeRunner.execute(mockSideEffectData);
        expect(result).toBe(true);
    });

    test('should return false when config.code is missing', async () => {
        const config = {};

        const codeRunner = new CodeRunnerSideEffect(config);
        const result = await codeRunner.execute(mockSideEffectData);
        expect(result).toBe(false);
    });

    test('should initialize transformer if missing', async () => {
        const config = { code: 'return JSON.parse(arguments[0]).payload;' };

        const codeRunner = new CodeRunnerSideEffect(config);
        const result = await codeRunner.execute(mockSideEffectData);
        expect(result).toBe(true);
    });

    test('should return false if code throws an error', async () => {
        const config = { code: 'throw new Error("Test error");' };

        const codeRunner = new CodeRunnerSideEffect(config);
        const result = await codeRunner.execute(mockSideEffectData);
        expect(result).toBe(false);
    });

    test('should handle fetch calls correctly', async () => {
        const config = { code: 'return fetch(`https://jsonplaceholder.typicode.com/todos/1`).then(response => response.json());' };

        // Mock fetch response
        fetchMock.mockImplementation(() =>
            Promise.resolve({
                json: () => Promise.resolve('response')
            }) as unknown as Promise<Response>
        );

        const codeRunner = new CodeRunnerSideEffect(config);
        const result = await codeRunner.execute(mockSideEffectData);
        expect(result).toBe(true);
        expect(fetchMock).toHaveBeenCalled();
    });

    test('should identify accepted and non-accepted events', () => {
        expect(CodeRunnerSideEffect.doesConsumeEvent('DEFAULT_TRANSFORMER_END_EVENT')).toBe(true);
        expect(CodeRunnerSideEffect.doesConsumeEvent('OTHER_EVENT')).toBe(false);
    });

});