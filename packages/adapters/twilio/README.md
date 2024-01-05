# Nodejs Twilio SMS Provider

A twilio sms provider library for [@samagra-x/uci-adapters-factory](https://github.com/PraVriShti/packages/tree/main/packages/adapters/twilio)

Taken from: [@novu/stateless](https://github.com/novuhq/novu)

## Usage

```javascript
import { AdapterFactory } from '@samagra-x/uci-adapters-factory';

const adapter = AdapterFactory.getAdapter({
    type: 'TwilioSms',
    config: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.TWILIO_FROM_NUMBER, // a valid twilio phone number
    }
});

await adapter.sendMessage({
  to: '0123456789',
  content: 'Message to send',
});
```
