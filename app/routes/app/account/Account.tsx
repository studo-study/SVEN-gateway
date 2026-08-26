import type { Route } from "./+types/Account";


export function meta({}: Route.MetaArgs) {
    return [
        { title: "Account - SVEN Gateway" },
        { name: "description", content: "About this app" },
    ];
}

export function loader() {
    return { message: "Hello from the about loader" };
}

export default function Account({ loaderData }: Route.ComponentProps) {
    return (
        <main>
            <h1>Account</h1>
            <p>{loaderData.message}</p>
        </main>
    );
}
