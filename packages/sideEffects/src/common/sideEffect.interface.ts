import { SideEffectData } from "./sideEffect.types";

export interface ISideEffect {
    getName(): string;
    execute(sideEffectData: SideEffectData): Promise<Boolean>;
}
