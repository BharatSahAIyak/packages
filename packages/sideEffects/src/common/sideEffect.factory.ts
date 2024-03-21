import { TelemetrySideEffect } from "../telemetry/telemetry.sideEffect";
import { ISideEffect } from "./sideEffect.interface";

const supportedSideEffects = [
    TelemetrySideEffect,
];

export class SideEffectFactory {
    static getSideEffects(eventName: string, config: Record<string, any>): ISideEffect[] {
        return supportedSideEffects.reduce((acc, effect) => {
            if (effect.doesConsumeEvent(eventName)) {
                acc.push(new effect(config));
            }
            return acc;
        }, [] as ISideEffect[]);
    }
}
