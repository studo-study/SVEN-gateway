import type { Route } from "./+types/Login";
import LoginForm from "./components/LoginForm"

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
        <main className={"flex flex-1 w-screen h-screen items-center justify-center"}>
                <LoginForm/>
        </main>
    );
}
