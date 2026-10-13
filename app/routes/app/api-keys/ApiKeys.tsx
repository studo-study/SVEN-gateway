import {PageTitle} from "~/components/design_system/pageTitle/PageTitle";
import type {Route} from "./+types/ApiKeys";
import Button from "~/components/design_system/button/Button";
import {PlusIcon} from "lucide-react";


export function meta({}: Route.MetaArgs) {
    return [
        {title: "API-keys - SVEN Gateway"},
        {name: "description", content: "About this app"},
    ];
}

export function loader() {
    return {message: "Hello from the about loader"};
}

const Columns = [
    {
        title: "name",
        width: "1.2fr",
    },
    {
        title: "environment",
        width: "0.8fr",
    },
    {
        title: "creator",
        width: "0.8fr",
    },
    {
        title: "created at",
        width: "12rem",
    },
    {
        title: "last used at",
        width: "12rem",
    },
    {
        title: "delete",
        width: "8rem",
    }
];

const KeyTableHeader = () => {
    const template = Columns.reduce((temp, col) => temp + " " + col.width, "")
    return(
        <div
            style={{
                gridTemplateColumns: template,
            }}
            className={"grid grid-cols-6 h-8 border-b border-neutral-200 bg-neutral-100 rounded-tl-xl rounded-tr-xl"}>
            {
                Columns.map((col) => (
                    <div className={"flex flex-row px-3 h-8 items-center tracking-wider uppercase text-[11px] text-neutral-400"}>
                        {col.title}
                    </div>
                ))
            }
        </div>
    )
}
const KeyTable = () => {
    return (<div className={"flex flex-col"}>
        <KeyTableHeader/>
        <div className={"border-b border-l flex flex-col border-r rounded-bl-xl rounded-br-xl border-neutral-200 min-h-10 divide-y divide-neutral-200"}>
        </div>
    </div>)
}
export default function ApiKeys({loaderData}: Route.ComponentProps) {
    return (
        <main className={"flex flex-col gap-3"}>
            <PageTitle title={"API-keys"} actions={<Button iconLeft={<PlusIcon size={15}/>} size={"sm"} variant={"secondary"}>Create API key</Button>}/>
            <KeyTable/>
        </main>
    );
}
