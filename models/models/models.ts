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

export interface ApiKeyResponse {
    id: string;
    userId: string;
    description: string;
    environment: "dev" | "staging" | "prod";
    prefix: string;
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    revokedAt: string | null;
}

export interface CreatedApiKeyResponse extends ApiKeyResponse {
    secret: string;
}
