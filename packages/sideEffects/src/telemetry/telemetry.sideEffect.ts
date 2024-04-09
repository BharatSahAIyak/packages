import { ISideEffect } from "../common/sideEffect.interface";
import { Events, SideEffectData } from "../common/sideEffect.types";

type SubEventData = {
    botId: string;
    userId: string;
    orgId: string;
    messageId?: string;
    error?: string;
    totalTime?: number;
}

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
    eventData:SubEventData;
}

const AcceptedEvents: string[] = [
    Events.DEFAULT_TRANSFORMER_START_EVENT,
    Events.DEFAULT_TRANSFORMER_END_EVENT,
];

export class TelemetrySideEffect implements ISideEffect {
    constructor(private readonly config: Record<string, any>) { }

    static getName(): string {
        return "Telemetry";
    }

    static doesConsumeEvent(eventName: string): Boolean {
        return AcceptedEvents.includes(eventName);
    }

    async execute(sideEffectData: SideEffectData): Promise<boolean> {
        try {
            const eventData: ConstructedEventData = this.createEventData(sideEffectData);
            const host: string = this.extractHostFromConfig();

            if (!eventData || !host) {
                console.error("Event data or host not found.");
                return false;
            }

            await this.sendEventDataToTelemetry(eventData, host);
            console.log("Event data sent to Telemetry service successfully.");
            return true;
        } catch (error) {
            console.error("Error occurred during telemetry:", error);
            return false;
        }
    }

    private createEventData(sideEffectData: SideEffectData): ConstructedEventData {
        const subEventData: SubEventData = {
            botId: sideEffectData.eventData.app!,
            userId: sideEffectData.eventData.to.userID,
            orgId: sideEffectData.eventData?.orgId!,
            messageId: sideEffectData.eventData?.messageId.Id,
        };

        const eventData: ConstructedEventData = {
            generator: sideEffectData.transformerId,
            version: '0.0.1',
            timestamp: sideEffectData.timestamp,
            actorId: sideEffectData.transformerId,
            actorType: 'Transformer',
            env: process.env.ENVIRONMENT || 'UNKNOWN',
            eventId: 'E041',
            event: 'Transformer Execution',
            subEvent: sideEffectData.eventName,
            eventData: subEventData
        };

        if (sideEffectData.eventName === Events.DEFAULT_TRANSFORMER_END_EVENT) {
            eventData.timeElapsed = sideEffectData.eventData.transformer?.metaData?.stateExecutionTime;
            eventData.eventId = 'E042';
        }
    
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
                console.log(await resp.json());
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
