import { TelemetrySideEffect } from "../telemetry/telemetry.sideEffect";
import { ISideEffect } from "./sideEffect.interface";

export const SupportedSideEffects = [
    TelemetrySideEffect,
];

export class SideEffectFactory {
    static getSideEffects(
        eventName: string,
        config: Record<string, any>,
        filteredSideEffects: Partial<typeof SupportedSideEffects>
    ): ISideEffect[] {
        return filteredSideEffects.reduce((acc, effect) => {
            if (effect?.doesConsumeEvent(eventName)) {
                acc.push(new effect(config[effect.getName()] ?? {}));
            }
            return acc;
        }, [] as ISideEffect[]);
    }
}
