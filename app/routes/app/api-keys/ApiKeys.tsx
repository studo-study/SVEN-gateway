import type { Route } from "./+types/ApiKeys";


export function meta({}: Route.MetaArgs) {
    return [
        { title: "API-keys - SVEN Gateway" },
        { name: "description", content: "About this app" },
    ];
}

export function loader() {
    return { message: "Hello from the about loader" };
}

export default function ApiKeys({ loaderData }: Route.ComponentProps) {
    return (
        <main>
            <h1>API-keys</h1>
            <p>{loaderData.message}</p>
        </main>
    );
}
