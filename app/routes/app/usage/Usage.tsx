import type { Route } from "./+types/Usage";


export function meta({}: Route.MetaArgs) {
    return [
        { title: "Usage - SVEN Gateway" },
        { name: "description", content: "About this app" },
    ];
}

export function loader() {
    return { message: "Hello from the about loader" };
}

export default function Usage({ loaderData }: Route.ComponentProps) {
    return (
        <main>
            <h1>Usage</h1>
            <p>{loaderData.message}</p>
        </main>
    );
}
