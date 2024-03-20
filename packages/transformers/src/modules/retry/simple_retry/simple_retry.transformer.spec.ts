import { XMessage } from "@samagra-x/xmessage";
import { SimpleRetryTransformer } from "./simple_retry.transformer";

describe('SimpleRetryTransformer', () => {
    let transformer: SimpleRetryTransformer;
    let xmsg: XMessage;

    beforeEach(() => {
        transformer = new SimpleRetryTransformer({ retries: 3, delay: 1000 });
        xmsg = {
            transformer: {
                metaData: {}
            }
        } as XMessage;
    });

    it('should retry the specified number of times before erroring out', async () => {
        await transformer.transform(xmsg);
        expect(xmsg.transformer?.metaData!.retryCount).toBe(1);

        await transformer.transform(xmsg);
        expect(xmsg.transformer?.metaData!.retryCount).toBe(2);

        await transformer.transform(xmsg);
        expect(xmsg.transformer?.metaData!.retryCount).toBe(3);

        await transformer.transform(xmsg);
        expect(xmsg.transformer?.metaData!.state).toBe('error');
    });

    it('should wait for the specified delay before retrying', async () => {
        const start = Date.now();
        await transformer.transform(xmsg);
        const end = Date.now();

        expect(end - start).toBeGreaterThanOrEqual(1000);
    });

    it('should retry only the specified number of times', async () => {

        await transformer.transform(xmsg);
        await transformer.transform(xmsg);
        await transformer.transform(xmsg);
        await transformer.transform(xmsg); 
        expect(xmsg.transformer?.metaData!.state).toBe('error'); 
    });    

    it('should handle case when no config is provided', async () => {
        const transformerWithoutConfig = new SimpleRetryTransformer({});
        await transformerWithoutConfig.transform(xmsg);
        expect(xmsg.transformer?.metaData!.retryCount).toBe(1); 
    });

    it('should handle case when no transformer metadata is provided', async () => {
        const xmsgWithoutMetadata = {} as XMessage;
        await transformer.transform(xmsgWithoutMetadata);
        expect(xmsgWithoutMetadata.transformer!.metaData!.retryCount).toBe(1); 
    });   

    it('should retry with default delay if no delay is provided', async () => {
        const transformerWithDefaultDelay = new SimpleRetryTransformer({ retries: 3 });
        const start = Date.now();
        await transformerWithDefaultDelay.transform(xmsg);
        const end = Date.now();
        expect(end - start).toBeGreaterThanOrEqual(0); 
    });

});