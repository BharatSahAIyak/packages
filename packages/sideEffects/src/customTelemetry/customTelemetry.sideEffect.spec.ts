import { CustomTelemetrySideEffect } from './customTelemetry.sideEffect';
import { Events, SideEffectData } from '../common/sideEffect.types';
import { MessageState, MessageType } from '@samagra-x/xmessage';

// Mock the global fetch function
global.fetch = jest.fn();

describe('CustomTelemetrySideEffect', () => {
  let mockFetch: jest.Mock;

  beforeEach(() => {
    mockFetch = global.fetch as jest.Mock;
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'success' })
    });
  });

  const mockSideEffectData: SideEffectData = {
    eventName: Events.CUSTOM_TELEMETRY_EVENT_LOG,
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

  test('single event configuration', async () => {
    const config = {
      host: 'https://telemetry.dev.bhasai.samagra.io',
      eventId: 'E012',
      setters: {
        text: 'transformer.metaData.responseInEnglish',
        prompt: 'transformer.metaData.prompt',
        streamStartLatency: 'transformer.metaData.streamStartLatency',
        translatedResponse: 'payload.text',
        isGuided: 'transformer.metaData.isGuided',
        responseType: 'transformer.metaData.responseType',
        isFlowEnd: 'transformer.metaData.isFlowEnd',
      },
    };

    const sideEffect = new CustomTelemetrySideEffect(config);
    const result = await sideEffect.execute(mockSideEffectData);

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://telemetry.dev.bhasai.samagra.io/metrics/v1/save',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const sentData = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentData).toHaveLength(1);
    expect(sentData[0]).toMatchObject({
      generator: 'Transformer',
      version: '0.0.1',
      timestamp: 1631234567890, // Note: Timestamp is truncated to seconds
      actorId: 'test-user',
      actorType: 'System',
      eventId: 'E012',
      event: 'Transformer Execution',
      subEvent: Events.CUSTOM_TELEMETRY_EVENT_LOG,
      eventData: expect.objectContaining({
        botId: 'test-bot',
        orgId: 'test-org',
        messageId: 'test-message-id',
        transformerId: 'test-transformer',
        text: 'Test response in English',
        prompt: 'Test prompt',
        streamStartLatency: 50,
        translatedResponse: 'Test payload text',
        isGuided: true,
        responseType: 'text',
        isFlowEnd: false,
        eventLog: 'Test log',
      }),
    });
  });

  test('multiple events configuration', async () => {
    const config = {
      host: 'https://telemetry.dev.bhasai.samagra.io',
      events: [
        {
          eventId: 'E012',
          setters: {
            text: 'transformer.metaData.responseInEnglish',
            prompt: 'transformer.metaData.prompt',
          },
        },
        {
          eventId: 'E013',
          setters: {
            streamStartLatency: 'transformer.metaData.streamStartLatency',
            translatedResponse: 'payload.text',
          },
        },
      ],
    };

    const sideEffect = new CustomTelemetrySideEffect(config);
    const result = await sideEffect.execute(mockSideEffectData);

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);

    const firstCallData = JSON.parse(mockFetch.mock.calls[0][1].body);
    const secondCallData = JSON.parse(mockFetch.mock.calls[1][1].body);

    expect(firstCallData).toHaveLength(1);
    expect(firstCallData[0]).toMatchObject({
      eventId: 'E012',
      eventData: expect.objectContaining({
        text: 'Test response in English',
        prompt: 'Test prompt',
      }),
    });

    expect(secondCallData).toHaveLength(1);
    expect(secondCallData[0]).toMatchObject({
      eventId: 'E013',
      eventData: expect.objectContaining({
        streamStartLatency: 50,
        translatedResponse: 'Test payload text',
      }),
    });
  });

  test('error handling', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const config = {
      host: 'https://telemetry.dev.bhasai.samagra.io',
      eventId: 'E012',
      setters: {},
    };

    const sideEffect = new CustomTelemetrySideEffect(config);
    const result = await sideEffect.execute(mockSideEffectData);

    expect(result).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});