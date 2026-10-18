import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import type {CreateModelRequest, FullModelListResponse, FullModelResponse} from "../../models/models/models";
import {useMe} from "~/auth/auth";

const baseUrl = import.meta.env.VITE_API_URL + "/v1";
export function useModels () {
    const session = useMe()?.data;
    return useQuery<FullModelListResponse>({
        queryKey: ["models"],
        queryFn: async () => {
            const res = await fetch(baseUrl + "/models", {
                headers: { Authorization: `Bearer ${session!.token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch models");
            return res.json();
        },
        enabled: !!session,
        staleTime: 60_000,
    });
}

export function useCreateModel() {
    const token = useMe()?.data?.token;
    const queryClient = useQueryClient();
    return useMutation<FullModelResponse, Error, CreateModelRequest>({
        mutationFn: async (body) => {
            const res = await fetch(baseUrl + "/models", {
                method: "POST",
                headers: {"Content-Type": "application/json", Authorization: `Bearer ${token}`},
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        },
        onSuccess: () => queryClient.invalidateQueries({queryKey: ["models"]}),
    });
}
