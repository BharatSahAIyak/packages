export enum TransformerType {
    HTTP_POST = 'HTTP_POST',
    HTTP_GET = 'HTTP_GET',
    LABEL_CLASSIFIER = 'LABEL_CLASSIFIER',
    RANDOM_BINARY = 'RANDOM_BINARY',
    SIMPLE_RETRY = 'SIMPLE_RETRY',
    NEURAL_COREFERENCE = 'NEURAL_COREFERENCE',
    DOC_RETRIEVER = 'DOC_RETRIEVER',
    LLM = 'LLM'
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
    [TransformerType.NEURAL_COREFERENCE]: TransformerClass.GenericTransformer,
    [TransformerType.DOC_RETRIEVER]: TransformerClass.IfElseTransformer,
    [TransformerType.LLM]: TransformerClass.GenericTransformer,
};
