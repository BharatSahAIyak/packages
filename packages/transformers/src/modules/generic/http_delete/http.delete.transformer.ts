import { XMessage } from "@samagra-x/xmessage";
import { ITransformer } from "../../common";
import { TelemetryLogger } from "../../common/telemetry";

export class HttpDeleteTransformer implements ITransformer {

  /// Accepted config properties:
  ///     url: Url of the endpoint. If not provided, `XMessage.transformer.metaData.httpUrl` will be used.
  ///     headers: Headers for request. If not provided, `XMessage.transformer.metaData.httpHeaders` will be used. (optional).
  ///     query: Query string starting with '?' for HTTP request. If not provided, `XMessage.transformer.metaData.httpQuery` will be used. (optional)
  ///     queryJson: Query parameters in JSON format. If not provided, `XMessage.transformer.metaData.httpQueryJson` will be used. Will be ignored if `query` is passed. (optional)
  constructor(readonly config: Record<string, any>) {}
  private readonly telemetryLogger = new TelemetryLogger(this.config);

  async transform(xmsg: XMessage): Promise<XMessage> {
    const startTime = ((performance.timeOrigin + performance.now()) * 1000);
    if (!xmsg.transformer) {
      xmsg.transformer = {
        metaData: {}
      };
    }
    console.log("HTTP DELETE transformer called.");

    this.config.url = this.config.url ?? xmsg.transformer?.metaData?.httpUrl;
    this.config.queryJson = this.config.queryJson ?? xmsg.transformer?.metaData?.httpQueryJson ?? {};
    this.config.headers = this.config.headers ?? xmsg.transformer?.metaData?.httpHeaders ?? {};
    this.config.headers = typeof this.config.headers === 'string' ? JSON.parse(this.config.headers || "{}") : this.config.headers ?? {};
    this.config.headers['Content-Type'] = 'application/json';
    this.config.query = this.config.query ?? xmsg.transformer?.metaData?.httpQuery ?? this.createQueryString(this.config.queryJson);
    this.config.query = this.config.query?.replace(/\\/g, '');

    console.log("query:", `${this.config.url}${this.config.query ?? ''}`)
    console.log("headers", JSON.stringify(this.config.headers))
    if (!this.config.url) {
      this.telemetryLogger.sendErrorTelemetry(xmsg, '`url` not defined in HTTP_DELETE transformer');
      throw new Error('`url` not defined in HTTP_DELETE transformer');
    }
    await fetch(`${this.config.url}${this.config.query ?? ''}`, {
      method: 'DELETE',
      headers: new Headers(this.config.headers),
    })
      .then(resp => {
        if (!resp.ok) {
          this.telemetryLogger.sendErrorTelemetry(xmsg, `Request failed with code: ${resp.status}`);
          throw new Error(`Request failed with code: ${resp.status}`);
        } else {
          const contentType = resp.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            return resp.json();
          } else {
            return resp.text();
          }
        }
      })
      .then((resp) => {
        if (!xmsg.transformer) {
          xmsg.transformer = {
            metaData: {}
          };
        }
        xmsg.transformer.metaData!.httpResponse = resp;
      })
      .catch((ex) => {
        this.telemetryLogger.sendErrorTelemetry(xmsg, `DELETE request failed. Reason: ${ex}`);
        console.error(`DELETE request failed. Reason: ${ex}`);
        throw ex;
      });
    this.telemetryLogger.sendLogTelemetry(xmsg, `${this.config.transformerId} finished!`, startTime);
    return xmsg;
  }

  private createQueryString(queryJson: Record<string, string>): string {
    if (Object.keys(queryJson).length === 0) {
      return '';
    }
    const queryString = Object.entries(queryJson)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return `?${queryString}`;
  }
}
