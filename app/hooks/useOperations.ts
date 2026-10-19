import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import type {CreateOperationRequest, OperationListResponse, OperationResponse} from "../../models/models/models";
import {useMe} from "~/auth/auth";

const baseUrl = import.meta.env.VITE_API_URL + "/v1/operations";
const queryKey = ["operations"];

export function useOperations() {
    const token = useMe()?.data?.token;
    return useQuery<OperationListResponse>({
        queryKey,
        queryFn: async () => {
            const res = await fetch(baseUrl, {headers: {Authorization: `Bearer ${token}`}});
            if (!res.ok) throw new Error("Failed to fetch operations");
            return res.json();
        },
        enabled: !!token,
        staleTime: 60_000,
    });
}

export function useCreateOperation() {
    const token = useMe()?.data?.token;
    const queryClient = useQueryClient();
    return useMutation<OperationResponse, Error, CreateOperationRequest>({
        mutationFn: async (body) => {
            const res = await fetch(baseUrl, {
                method: "POST",
                headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({queryKey}),
    });
}

export function useUpdateOperation() {
    const token = useMe()?.data?.token;
    const queryClient = useQueryClient();
    return useMutation<OperationResponse, Error, { id: string } & CreateOperationRequest>({
        mutationFn: async ({id, ...body}) => {
            const res = await fetch(`${baseUrl}/${id}`, {
                method: "PUT",
                headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({queryKey}),
    });
}
