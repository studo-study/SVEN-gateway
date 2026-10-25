import type { Route } from "./+types/Activity";
import {PageTitle} from "~/components/design_system/pageTitle/PageTitle";
import Table from "~/components/design_system/table/Table";


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
    return <main>
        <PageTitle title={'Activity'}/>
        <Table columns={[]} rows={[]} rowKey={() => ""}/>
    </main>;
}
