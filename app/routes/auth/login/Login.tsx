import type { Route } from "./+types/Login";


export function meta({}: Route.MetaArgs) {
    return [
        { title: "Usage - SVEN Gateway" },
        { name: "description", content: "About this app" },
    ];
}

export function loader() {
    return { message: "Hello from the about loader" };
}

export default function Login({ loaderData }: Route.ComponentProps) {
    return (
        <main>
            <h1>Login</h1>
            <p>{loaderData.message}</p>
        </main>
    );
}
