import { HttpStatusCode } from "axios";
import { ISideEffect } from "../common/sideEffect.interface";
import { Events, SideEffectData } from "../common/sideEffect.types";
import get from 'lodash/get';
import set from 'lodash/set';

type ConstructedEventData = {
    generator: string;
    version: string;
    timestamp: number;
    actorId: string;
    actorType: string;
    sessionId?: string;
    deviceId?: string;
    env: string;
    eventId: string;
    event: string;
    subEvent: string;
    timeElapsed?: number;
    eventData: Record<string, any>;
}

const AcceptedEvents: string[] = [
    Events.CUSTOM_TELEMETRY_EVENT_LOG,
    Events.CUSTOM_TELEMETRY_EVENT_ERROR,
];

export class CustomTelemetrySideEffect implements ISideEffect {
    constructor(private readonly config: Record<string, any>) {}

    static getName(): string {
        return "CustomTelemetry";
    }

    static doesConsumeEvent(eventName: string): Boolean {
        return AcceptedEvents.includes(eventName);
    }

    async execute(sideEffectData: SideEffectData): Promise<boolean> {
        try {
            const host: string = this.extractHostFromConfig();
            
            if (this.config.events) {
                const eventData: ConstructedEventData[] = this.config.events.map((event: {
                    eventId: string,
                    setters: Record<string, string>
                }) => this.createEventData(sideEffectData, event.eventId, event.setters));

                if (!eventData || !host) {
                    console.error("Event data or host not found.");
                    return false;
                }
                
                await Promise.all(eventData.map((event) => this.sendEventDataToTelemetry(event, host)));
            } else {
                /// NOTE: This spec can be planned to be deprecated
                const eventData: ConstructedEventData = this.createEventData(sideEffectData, this.config.eventId, this.config.setters);

                if (!eventData || !host) {
                    console.error("Event data or host not found.");
                    return false;
                }

                await this.sendEventDataToTelemetry(eventData, host);
            }
            console.log("Event data sent to Telemetry service successfully.");
            return true;
        } catch (error) {
            console.error("Error occurred during telemetry:", error);
            return false;
        }
    }

    private createEventData(sideEffectData: SideEffectData, eventId: string, setters: Record<string, string>): ConstructedEventData {
        const subEventData: any = {
            botId: sideEffectData.eventData.app!,
            orgId: sideEffectData.eventData?.orgId!,
            messageId: sideEffectData.eventData?.messageId.Id,
            transformerId: sideEffectData.transformerId,
            text: sideEffectData.eventData.payload.text,
            userId: sideEffectData.eventData.from?.userID || sideEffectData.eventData.to.userID,
            timeTaken: sideEffectData.eventData.transformer?.metaData?.stateExecutionTime,
        };

        const eventData: ConstructedEventData = {
            generator: 'Transformer',
            version: '0.0.1',
            timestamp: sideEffectData.timestamp,
            // For cases where a node maybe the end node and to and from have been switched
            actorId: sideEffectData.eventData.from?.userID || sideEffectData.eventData.to.userID,
            actorType: 'System',
            env: process.env.ENVIRONMENT || 'UNKNOWN',
            eventId: eventId ?? 'UNKNOWN_EVENT_ID',
            event: 'Transformer Execution',
            subEvent: sideEffectData.eventName,
            eventData: subEventData
        };

        if (sideEffectData.eventName == Events.CUSTOM_TELEMETRY_EVENT_LOG) {
            subEventData['eventLog'] = sideEffectData.eventData.transformer?.metaData?.telemetryLog;
        }
        else if (sideEffectData.eventName == Events.CUSTOM_TELEMETRY_EVENT_ERROR) {
            subEventData['error'] = sideEffectData.eventData.transformer?.metaData?.errorString;
        }

        Object.entries(setters ?? {}).forEach((entry) => {
            set(subEventData, entry[0], get(sideEffectData.eventData, entry[1])); // setters have values as xMsg fields
        });

        eventData.timestamp = Math.trunc(eventData.timestamp / 1000);

        return eventData;
    }

    private extractHostFromConfig(): string {
        return this.config.host;
    }

    private async sendEventDataToTelemetry(eventData: ConstructedEventData, host: string): Promise<void> {
        try {
            await fetch(`${host}/metrics/v1/save`, {
                method: 'POST',
                body: JSON.stringify([eventData]),
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(async (resp) => {
                if (resp.status == HttpStatusCode.BadRequest) {
                    console.log(JSON.stringify(await resp.json()));
                }
                if (!resp.ok) {
                    throw new Error(`Failed to send telemetry, status: ${resp.status}`);
                }
            });
        } catch (error) {
            console.error(`Error occurred while sending event data to Telemetry service: ${error}`);
            throw error;
        }
    }
}
