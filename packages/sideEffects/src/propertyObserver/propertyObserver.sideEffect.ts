import { XMessage } from "@samagra-x/xmessage";
import { ISideEffect } from "../common/sideEffect.interface";
import { Events, SideEffectData } from "../common/sideEffect.types";
import AsyncLock from 'async-lock';
import get from 'lodash/get';
import { isEqual } from "lodash";
const ivm = require('isolated-vm');

const AcceptedEvents: string[] = [
    Events.DEFAULT_TRANSFORMER_START_EVENT,
    Events.DEFAULT_TRANSFORMER_END_EVENT,
];

export class PropertyObserverSideEffect implements ISideEffect {

    /// Accepted config properties:
    ///     observers: Record<string, string>
    ///
    /// The observers object is a key-value pair, where key respresents
    /// the vaule that needs to be observed and value is the code string
    /// that needs to be executed.
    ///
    /// Example:
    /// "sideEffects": {
    ///     "PropertyObserver": {
    ///         "observers": {
    ///             "payload.text": "const newMsg = JSON.parse($1);console.log(`New Value: ${newMsg}`);",
    ///             "payload.from.userID": "const oldMsg = JSON.parse($0);console.log(`Old Value: ${oldMsg}`);",
    ///         },
    ///     }
    /// }
    /// The previous `XMessage` object will be provided in the context
    /// as a stringified JSON in $0.
    /// The current `XMessage` object will be provided in the context
    /// as a stringified JSON in $1.
    constructor(private readonly config: Record<string, any>) {
        this.observers = config.observers;
    }

    /// Serves as a temporary data store since, side effects are
    /// isolated across events, and placing data inside `XMessage`
    /// would not work since they are not synced to original `XMessage`
    /// in case of side effects and there is no way to pass on data.
    static temporaryCacheStore: Map<string, XMessage> = new Map();

    /// Lock to handle concurrent changes on `temporaryCacheStore`.
    private static cacheLock = new AsyncLock();

    private readonly observers: Record<string, string>;
    private readonly lockKey = 'lockKey';

    static getName(): string {
        return "PropertyObserver";
    }

    static doesConsumeEvent(eventName: string): Boolean {
        return AcceptedEvents.includes(eventName);
    }

    async execute(sideEffectData: SideEffectData): Promise<boolean> {
        try {
            if (sideEffectData.eventName == Events.DEFAULT_TRANSFORMER_START_EVENT) {
                // Store the initial value of the XMessage.
                await PropertyObserverSideEffect.cacheLock.acquire(
                    this.lockKey,
                    () => PropertyObserverSideEffect.temporaryCacheStore.set(
                        sideEffectData.eventData.messageId.Id,
                        sideEffectData.eventData
                    )
                );
            }
            else {
                const isolate = new ivm.Isolate({ memoryLimit: 64 });
                const context = isolate.createContextSync();
                const jail = context.global;
                jail.setSync('global', jail.derefInto());
                await PropertyObserverSideEffect.cacheLock.acquire(
                    this.lockKey,
                    () => {
                        const oldMsg = PropertyObserverSideEffect.temporaryCacheStore.get(sideEffectData.eventData.messageId.Id);
                        const newMsg = sideEffectData.eventData;
                        if (oldMsg) {
                            Object.entries(this.observers)
                            .filter(([property, _]) => !isEqual(get(oldMsg, property), get(newMsg, property)))
                            .forEach(([property, code]) => {
                                console.log(`Executing function for changed property '${property}'`);
                                this.executeIsolatedCode(oldMsg, newMsg, code, context);
                            });
                        }
                        // Cleanup stored XMessage
                        PropertyObserverSideEffect.temporaryCacheStore.delete(newMsg.messageId.Id);
                    }
                );
            }
            return true;
        } catch (error) {
            console.error("Error occurred during telemetry:", error);
            return false;
        }
    }
    
    private executeIsolatedCode(oldMessage: XMessage, newMessage: XMessage, code: string, context: any) {
        context.evalClosureSync(
            this.config.code,
            [ JSON.stringify(oldMessage), JSON.stringify(newMessage) ],
            {
                timeout: 30_000,
            }
        );
    }
}
