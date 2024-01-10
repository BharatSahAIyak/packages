# Nodejs PWA Bot Provider

A pwa bot provider library for [@samagra-x/uci-adapters-factory](https://github.com/PraVriShti/packages/tree/main/packages/adapters/pwa)

## Usage

```javascript
import { AdapterFactory } from '@samagra-x/uci-adapters-factory';

const adapter = AdapterFactory.getAdapter({
    type: 'PwaBot',
    config: {
      socketEndpoint: 'ENDPOINT'
    }
});

await adapter.sendMessage(xmessage);
```
