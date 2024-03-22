import axios from 'axios';
import { SlackProvider } from './slack.provider';
import { SlackBotProviderConfig } from './slack.bot.config';
import { IChatOptions } from '@novu/stateless';

jest.mock('axios');

describe('SlackProvider', () => {
  const config: SlackBotProviderConfig = {
    botToken: 'TEST_TOKEN',
  };

  let provider: SlackProvider;

  beforeEach(() => {
    provider = new SlackProvider(config);
    jest.resetAllMocks();
  });

  test('should trigger Slack provider correctly with channel', async () => {
    const mockResponse = {
      data: {
        ok: true,
        messages: [
          {
            ts: 'MOCK_MESSAGE_ID',
          },
        ],
      },
    };
    (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const chatOptions: IChatOptions = {
      webhookUrl: '', 
      channel: 'CHANNEL123',
      content: 'chat message'
    };

    const result = await provider.sendMessage(chatOptions);

    expect(axios.post).toHaveBeenCalledWith(
      'https://slack.com/api/chat.postMessage',
      {
        text: 'chat message',
        channel: 'CHANNEL123',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer TEST_TOKEN',
        },
      }
    );
    expect(result).toEqual({ id: 'MOCK_MESSAGE_ID' });
  });

test('should trigger Slack provider correctly with webhookUrl', async () => {
    const mockResponse = {
      data: {
        ok: true,
      },
    };
    (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    const chatOptions: IChatOptions = {
      webhookUrl: 'https://example.com/webhook',
      content: 'chat message',
    };

    const result = await provider.sendMessage(chatOptions);

    expect(axios.post).toHaveBeenCalledWith(
      'https://example.com/webhook',
      {
        text: 'chat message',
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer TEST_TOKEN',
        },
      }
    );
    expect(result).toEqual({});
  });
});