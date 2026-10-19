import type { Route } from "./+types/Operations";
import {PageTitle} from "~/components/design_system/pageTitle/PageTitle";


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
            <PageTitle title={"Operations"}/>

        </main>
    );
}
