import type { Route } from "./+types/Settings";


export function meta({}: Route.MetaArgs) {
    return [
        { title: "About - SVEN Gateway" },
        { name: "description", content: "About this app" },
    ];
}

export function loader() {
    return { message: "Hello from the about loader" };
}

export default function Settings({ loaderData }: Route.ComponentProps) {
    return (
        <main>
            <h1>Settings</h1>
            <p>{loaderData.message}</p>
        </main>
    );
}
