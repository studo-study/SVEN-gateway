import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import type {ApiKeyResponse, CreatedApiKeyResponse} from "../../models/models/models";
import {useMe} from "~/auth/auth";

const baseUrl = import.meta.env.VITE_API_URL + "/v1/api-keys";
const queryKey = ["api-keys"];

function useRequest() {
    const token = useMe()?.data?.token;
    return async (path: string, init?: RequestInit) => {
        const res = await fetch(baseUrl + path, {
            ...init,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });
        if (!res.ok) throw new Error(await res.text());
        return res;
    };
}

export function useApiKeys() {
    const request = useRequest();
    const token = useMe()?.data?.token;
    return useQuery<ApiKeyResponse[]>({
        queryKey,
        queryFn: async () => (await request("")).json(),
        enabled: !!token,
    });
}

export function useCreateApiKey() {
    const request = useRequest();
    const queryClient = useQueryClient();
    return useMutation<CreatedApiKeyResponse, Error, { description: string; environment: string }>({
        mutationFn: async (body) =>
            (await request("", {method: "POST", body: JSON.stringify(body)})).json(),
        onSuccess: () => queryClient.invalidateQueries({queryKey}),
    });
}

export function useRevokeApiKey() {
    const request = useRequest();
    const queryClient = useQueryClient();
    return useMutation<unknown, Error, string>({
        mutationFn: (id) => request(`/${id}`, {method: "DELETE"}),
        onSuccess: () => queryClient.invalidateQueries({queryKey}),
    });
}
