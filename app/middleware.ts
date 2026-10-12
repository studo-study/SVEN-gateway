import { redirect, type MiddlewareFunction } from "react-router";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export const authMiddleware: MiddlewareFunction = async ({ request }) => {
    const cookie = request.headers.get("cookie");

    const res = await fetch(`${API_URL}/v1/auth/me`, {
        headers: cookie ? { cookie } : {},
    });

    if (!res.ok) {
        throw redirect("/login");
    }
};
