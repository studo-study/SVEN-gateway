import type { Route } from "./+types/Notifications";

export function meta({}: Route.MetaArgs) {
    return [
        { title: "Notifications - SVEN gateway" },
        { name: "description", content: "Welcome to React Router!" },
    ];
}

export default function Notifications() {
    return <main>homepage</main>;
}
