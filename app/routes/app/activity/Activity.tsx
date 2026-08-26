import type { Route } from "./+types/Activity";


export function meta({}: Route.MetaArgs) {
    return [
        { title: "Activity - SVEN Gateway" },
        { name: "description", content: "About this app" },
    ];
}

export function loader() {
    return { message: "Hello from the about loader" };
}

export default function Activity({ loaderData }: Route.ComponentProps) {
    return (
        <main>
            <h1>Activity</h1>
            <p>{loaderData.message}</p>
        </main>
    );
}
