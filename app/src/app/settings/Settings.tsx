import type { Route } from "./+types/Settings";
import {PageTitle} from "~/components/design_system/pageTitle/PageTitle";


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
            <PageTitle title={"Settings"}/>
        </main>
    );
}
