import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common/transformer.interface";
import { HttpGetTransformer } from "../../generic/http_get/http.get.transformer";
import { TelemetryLogger } from "../../common/telemetry";

export class QueryCacheTransformer implements ITransformer {

    /// Accepted config properties:
    ///     url: string: Endpoint of the caching service.
    ///     query: string: Query for which cached response is required. If not provided, `XMessage.payload.text` will be used.
    ///     threshold: number: The threshold similarity score below which results would not be considered. If not provided, 0.9 will be used.
    ///     persist: Boolean: If true, the response of query will be persisted to `payload.text` in xmsg.
    constructor(readonly config: Record<string, any>) {}
    private readonly telemetryLogger = new TelemetryLogger(this.config);

    async transform(xmsg: XMessage): Promise<XMessage> {
        this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} started!`, ((performance.timeOrigin + performance.now()) * 1000));
        if (!this.config.url) {
            this.telemetryLogger.sendErrorTelemetry(xmsg, 'url must be provided!');
            throw new Error('`url` must be provided!');
        }
        const resolvedQuery = this.config.query ?? xmsg.payload.text;
        if (!resolvedQuery) {
            this.telemetryLogger.sendErrorTelemetry(xmsg, 'query or payload.text must be defined!');
            throw new Error('`query` or `payload.text` must be defined!');
        }
        this.config.threshold = this.config.threshold ?? 0.9;
        const httpTransformer = new HttpGetTransformer({
            url: this.config.url,
            queryJson: {
                question: resolvedQuery,
                threshold: this.config.threshold,
            },
            headers: {
                botId: xmsg.app,
                orgId: xmsg.orgId,
            },
            eventBus: this.config.eventBus,
        });
        await httpTransformer.transform(xmsg)
            .then((resp) => {
                const queryResponse = resp.transformer!.metaData!.httpResponse?.answer;
                if (!queryResponse) {
                    throw new Error(`Cache API returned empty data: ${JSON.stringify(resp.transformer!.metaData!.httpResponse)}`);
                }
                xmsg.transformer!.metaData!.cacheResponse = queryResponse;
                xmsg.payload.text = this.config.persist ? queryResponse : xmsg.payload.text;
                xmsg.transformer!.metaData!.state = 'if';
                this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, ((performance.timeOrigin + performance.now()) * 1000));
            })
            .catch((err) => {
                console.log(`Failed to get a cache hit. Reason: ${err}`);
                this.telemetryLogger.sendErrorTelemetry(xmsg, `Failed to get a cache hit. Reason: ${err}`);
                xmsg.transformer!.metaData!.state = 'else';
            });
        return xmsg;
    }
}
