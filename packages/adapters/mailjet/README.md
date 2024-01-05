# Nodejs Mailjet Provider

A mailjet email provider library for [@samagra-x/uci-adapters-factory](https://github.com/PraVriShti/packages/tree/main/packages/adapters/mailjet)

Taken from: [@novu/stateless](https://github.com/novuhq/novu)

## Usage

```javascript
import { AdapterFactory } from '@samagra-x/uci-adapters-factory';

const adapter = AdapterFactory.getAdapter({
    type: 'MailjetEmail',
    config: {
      apiKey: process.env.MAILJET_APIKEY,
      apiSecret: process.env.MAILJET_API_SECRET,
      from: process.env.MAILJET_FROM_EMAIL,
    }
});
```
