export interface FullModelResponse {
    id: string;
    modelName: string | null;
    modelType: string;
    provider: string;
    costPerToken: number | null;
    createdAt: string;
    updatedAt: string | null;
    inputCostPm: number | null;
    outputCostPm: number | null;
    cachedCostPm: number | null;
    contextWindow: string | null;
    maxOutput: string | null;
    vision: boolean | null;
    platform: string | null;
    active: boolean;
    endpointUrl: string | null;
}

export interface FullModelListResponse {
    models: FullModelResponse[];
}
