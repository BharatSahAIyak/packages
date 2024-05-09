import { XMessage } from "@samagra-x/xmessage";
import { QueryCacheTransformer } from "./query_cache.transformer";
import fetchMock from 'fetch-mock';

const eventBus = {
    pushEvent: (event: any) => {}
}

describe('QueryCacheTransformer', () => {
    let xmsg: XMessage;

    beforeEach(() => {
        xmsg = {
            payload: {},
            transformer: {
                metaData: {}
            }
        } as XMessage;
    });

    afterEach(() => {
        fetchMock.restore();
    });

    it('transformer works as expected', async () => {
        fetchMock.getOnce('http://mockurl?question=my%20question&threshold=0.5', (url, _) => {
            const currentRequest = new URL(url);
            return {
                data: [
                    {
                        answer: currentRequest.searchParams.toString(),
                    }
                ]
            }
        });
        const transformerWithPrompt = new QueryCacheTransformer({
            url: 'http://mockurl',
            query: 'my question',
            threshold: 0.5,
            eventBus: eventBus,
        });
        const result = await transformerWithPrompt.transform(xmsg);
        expect(result.transformer?.metaData!.cacheResponse).toBe('question=my+question&threshold=0.5');
    });

    it('transformer sends default threshold', async () => {
        fetchMock.getOnce('http://mockurl?question=my%20question&threshold=0.9', (url, _) => {
            const currentRequest = new URL(url);
            return {
                data: [
                    {
                        answer: currentRequest.searchParams.toString(),
                    }
                ]
            }
        });
        const transformerWithPrompt = new QueryCacheTransformer({
            url: 'http://mockurl',
            query: 'my question',
            eventBus: eventBus,
        });
        const result = await transformerWithPrompt.transform(xmsg);
        expect(result.transformer?.metaData!.cacheResponse).toBe('question=my+question&threshold=0.9');
    });

    it('transformer throws when url is not passed', async () => {
        fetchMock.getOnce('http://mockurl?question=my%20question&threshold=0.9', (url, _) => {
            const currentRequest = new URL(url);
            return {
                data: [
                    {
                        answer: currentRequest.searchParams.toString(),
                    }
                ]
            }
        });
        const transformerWithPrompt = new QueryCacheTransformer({
            query: 'my question',
            eventBus: eventBus,
        });
        expect(transformerWithPrompt.transform(xmsg)).rejects.toThrow(new Error('`url` must be provided!'));
    });

    it('transformer throws when query is not passed', async () => {
        fetchMock.getOnce('http://mockurl?question=my%20question&threshold=0.9', (url, _) => {
            const currentRequest = new URL(url);
            return {
                data: [
                    {
                        answer: currentRequest.searchParams.toString(),
                    }
                ]
            }
        });
        const transformerWithPrompt = new QueryCacheTransformer({
            url: 'http://mockurl',
            eventBus: eventBus,
        });
        expect(transformerWithPrompt.transform(xmsg)).rejects.toThrow(new Error('`query` or `payload.text` must be defined!'));
    });

    it('transformer persists response', async () => {
        fetchMock.getOnce('http://mockurl?question=my%20question&threshold=0.5', (url, _) => {
            const currentRequest = new URL(url);
            return {
                data: [
                    {
                        answer: currentRequest.searchParams.toString(),
                    }
                ]
            }
        });
        const transformerWithPrompt = new QueryCacheTransformer({
            url: 'http://mockurl',
            query: 'my question',
            threshold: 0.5,
            persist: true,
            eventBus: eventBus,
        });
        const result = await transformerWithPrompt.transform(xmsg);
        expect(result.transformer?.metaData!.cacheResponse).toBe('question=my+question&threshold=0.5');
        expect(result.payload.text).toBe('question=my+question&threshold=0.5');
    });
});
