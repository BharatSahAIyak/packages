export enum TransformerType {
    HTTP_POST = 'HTTP_POST',
    HTTP_GET = 'HTTP_GET',
    SWITCH_CASE = 'SWITCH_CASE',
    RANDOM_BINARY = 'RANDOM_BINARY',
}

export enum TransformerClass {
    GenericTransformer,
    IfElseTransformer,
    SwitchCaseTransformer,
}

export const TransformerMapping: Record<TransformerType, TransformerClass> = {
    [TransformerType.HTTP_POST]: TransformerClass.GenericTransformer,
    [TransformerType.HTTP_GET]: TransformerClass.GenericTransformer,
    [TransformerType.SWITCH_CASE]: TransformerClass.SwitchCaseTransformer,
    [TransformerType.RANDOM_BINARY]: TransformerClass.IfElseTransformer,
};
