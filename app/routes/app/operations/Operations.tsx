import type { Route } from "./+types/Operations";


export function meta({}: Route.MetaArgs) {
    return [
        { title: "Operations - SVEN Gateway" },
        { name: "description", content: "About this app" },
    ];
}

export function loader() {
    return { message: "Hello from the about loader" };
}

export default function Operations({ loaderData }: Route.ComponentProps) {
    return (
        <main>
            <h1>Operations</h1>
            <p>{loaderData.message}</p>
        </main>
    );
}
