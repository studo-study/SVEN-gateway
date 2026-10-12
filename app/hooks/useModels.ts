import {useQuery} from "@tanstack/react-query";
import type {FullModelListResponse} from "../../models/models/models";
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