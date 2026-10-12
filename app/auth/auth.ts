import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type AuthUser = {
    id: string;
    email: string;
    roles: string[];
    token: string;
};

export class AuthError extends Error {
    status: number;
    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

async function loginRequest(email: string, password: string): Promise<AuthUser> {
    const res = await fetch(`${API_URL}/v1/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
        const message = await res.text();
        throw new AuthError(res.status, message || "Login failed");
    }

    return res.json();
}

async function logoutRequest(): Promise<void> {
    await fetch(`${API_URL}/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
    });
}

async function meRequest(): Promise<AuthUser | null> {
    const res = await fetch(`${API_URL}/v1/auth/me`, {
        credentials: "include",
    });

    if (res.status === 401) return null;
    if (!res.ok) throw new AuthError(res.status, "Failed to fetch current user");

    return res.json();
}

export const authQueryKey = ["auth", "me"] as const;

export function useMe() {
    return useQuery({
        queryKey: authQueryKey,
        queryFn: meRequest,
    });
}

export function useLogin() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            loginRequest(email, password),
        onSuccess: (user) => {
            queryClient.setQueryData(authQueryKey, user);
        },
    });
}

export function useLogout() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: logoutRequest,
        onSuccess: () => {
            queryClient.setQueryData(authQueryKey, null);
        },
    });
}
