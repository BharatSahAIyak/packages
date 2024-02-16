export enum TransformerType {
    HTTP_POST = 'HTTP_POST',
    HTTP_GET = 'HTTP_GET',
    LABEL_CLASSIFIER = 'LABEL_CLASSIFIER',
    RANDOM_BINARY = 'RANDOM_BINARY',
    SIMPLE_RETRY = 'SIMPLE_RETRY',
}

export enum TransformerClass {
    GenericTransformer,
    IfElseTransformer,
    SwitchCaseTransformer,
    RetryTransformer,
}

export const TransformerMapping: Record<TransformerType, TransformerClass> = {
    [TransformerType.HTTP_POST]: TransformerClass.GenericTransformer,
    [TransformerType.HTTP_GET]: TransformerClass.GenericTransformer,
    [TransformerType.LABEL_CLASSIFIER]: TransformerClass.SwitchCaseTransformer,
    [TransformerType.RANDOM_BINARY]: TransformerClass.IfElseTransformer,
    [TransformerType.SIMPLE_RETRY]: TransformerClass.RetryTransformer,
};
