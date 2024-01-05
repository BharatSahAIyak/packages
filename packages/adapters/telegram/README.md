# Nodejs Telegram Bot Provider

A telegram bot provider library for [@samagra-x/uci-adapters-factory](https://github.com/PraVriShti/packages/tree/main/packages/adapters/telegram)

Taken from: [@novu/stateless](https://github.com/novuhq/novu)

## Usage

```javascript
import { AdapterFactory } from '@samagra-x/uci-adapters-factory';

const adapter = AdapterFactory.getAdapter({
    type: 'TelegramBot',
    config: {
      botToken: 'TEST_BOT_TOKEN'
    }
});

await adapter.sendMessage({
  channel: '9999999',
  content: 'TEST_CONTENT',
});
```
