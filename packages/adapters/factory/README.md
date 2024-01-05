# UCI Adapter Provider Factory

A factory class that provides specific adapter types based on request data. [@samagra-x/uci-adapters-factory](https://github.com/PraVriShti/packages/tree/main/packages/adapters/factory)

## Usage

```javascript
    const adapter = AdapterFactory.getAdapter({
        type: 'TYPE_OF_ADAPTER',
        config: {
            configVariable: 'CONFIG_VALUE'
        }
    });
```
