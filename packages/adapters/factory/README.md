# UCI Adapter Provider Factory

A factory class that provides specific adapter types based on request data. [@samagra-x/uci-adapters-factory](https://github.com/PraVriShti/packages/tree/main/packages/adapters/factory)

## Usage

```typescript
import { AdapterFactory } from '@samagra-x/uci-adapters-factory';

const adapter = AdapterFactory.getAdapter({
    type: 'TYPE_OF_ADAPTER',
    config: {
        configVariable1: 'CONFIG_VALUE1',
        configVariable2: 'CONFIG_VALUE2',
        ...
    }
});

adapter.sendMessage(MESSAGE_DATA);
```

Take a look at [factory](./src/lib/adapter.factory.ts) to get a list of available adapters.