import {PageTitle} from "~/components/design_system/pageTitle/PageTitle";
import type {Route} from "./+types/ApiKeys";
import BaseDialog from "~/components/design_system/dialog/Dialog";
import Button from "~/components/design_system/button/Button";
import {PlusIcon, Trash2Icon} from "lucide-react";
import {useApiKeys, useCreateApiKey, useRevokeApiKey} from "~/hooks/useApiKeys";
import Input from "~/components/input/Input";
import InputSelect from "~/components/design_system/select/InputSelect";
import {type SetStateAction, useState} from "react";
import Table from "~/components/design_system/table/Table";
import type {IColumn} from "~/components/design_system/table";
import type {ApiKeyResponse} from "../../../../models/models/models";

interface IAddModal {
    description: string;
    setDescription: React.Dispatch<SetStateAction<string>>
    environment: string;
    setEnvironment: React.Dispatch<SetStateAction<string>>
    onCreate: () => void;
}


const AddModal: React.FC<IAddModal> = (props) => {
    const {description, setDescription, environment, setEnvironment, onCreate} = props;
    return (<BaseDialog
        trigger={
            <Button
                iconLeft={<PlusIcon size={15}/>}
                size={"sm"}
                variant={"secondary"}
            >
                Create API key
            </Button>}
        content={
            <div className={"max-w-200 md:min-w-120 mb-3 w-full h-fit flex flex-col"}>
                <h2 className={"font-medium capitalize mb-3"}>Create API key</h2>
                <p className={"text-sm text-neutral-400 mb-3"}>
                    Generate an API key to use in your environment
                </p>
                <div className={"flex flex-col gap-3"}>
                    <Input
                        value={description}
                        onChange={(input) => setDescription(input)}
                        placeholder={"description..."}
                        label={"description"}
                    />
                    <InputSelect
                        size={"lg"}
                        value={environment}
                        onChange={(input) => setEnvironment(input as string)}
                        placeholder={"environment..."}
                        label={"environment"}
                        options={[
                            {
                                value: "prod",
                                label: "Production"
                            },
                            {
                                value: "staging",
                                label: "Staging"
                            },
                            {
                                value: "dev",
                                label: "Development"
                            }
                        ]}
                    />
                </div>
            </div>
        }
        close={
        <Button variant={"secondary"}>
            cancel
        </Button>
        }

        next={
            <Button variant={"primary"} onClick={onCreate} disabled={!description.trim() || !environment}>
                Create
            </Button>
        }



    >
    </BaseDialog>)
}

export function meta({}: Route.MetaArgs) {
    return [
        {title: "API-keys - SVEN Gateway"},
        {name: "description", content: "About this app"},
    ];
}

export function loader() {
    return {message: "Hello from the about loader"};
}

const formatDate = (date: string | null) => date ? new Date(date + "Z").toLocaleString() : "never";

const KeyTable = () => {
    const {data: keys = []} = useApiKeys();
    const revoke = useRevokeApiKey();
    const columns: IColumn<ApiKeyResponse>[] = [
        {title: "description", width: "1.2fr", className: "truncate", render: (key) => key.description},
        {title: "environment", width: "0.8fr", render: (key) => key.environment},
        {
            title: "key", width: "0.8fr", className: "font-mono text-xs text-neutral-500",
            render: (key) => `${key.prefix}…`
        },
        {title: "created at", width: "12rem", className: "text-neutral-500", render: (key) => formatDate(key.createdAt)},
        {
            title: "last used at", width: "12rem", className: "text-neutral-500",
            render: (key) => formatDate(key.lastUsedAt)
        },
        {
            title: "revoke", width: "8rem", render: (key) => (
                <Button size={"sm"} variant={"secondary"} iconLeft={<Trash2Icon size={15}/>}
                        onClick={() => revoke.mutate(key.id)}>
                    Revoke
                </Button>
            )
        },
    ];
    return <Table columns={columns} rows={keys} rowKey={(key) => key.id}/>;
}
export default function ApiKeys({loaderData}: Route.ComponentProps) {
    const [environment, setEnvironment] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [secret, setSecret] = useState<string | null>(null);
    const create = useCreateApiKey();
    const onCreate = () => create.mutate({description, environment}, {
        onSuccess: (key) => {
            setSecret(key.secret);
            setDescription("");
            setEnvironment("");
        },
    });
    return (
        <main className={"flex flex-col gap-3"}>
            <PageTitle title={"API-keys"}
                       actions={
                           <AddModal
                               description={description}
                               setDescription={setDescription}
                               environment={environment}
                               setEnvironment={setEnvironment}
                               onCreate={onCreate}
                           />
                       }/>
            {secret && (
                <div className={"flex flex-col gap-1 p-3 rounded-xl border border-neutral-200 bg-neutral-50"}>
                    <span className={"text-xs text-neutral-400"}>Copy this key now, it won't be shown again.</span>
                    <code className={"text-sm break-all"}>{secret}</code>
                    <div>
                        <Button size={"sm"} variant={"secondary"} onClick={() => setSecret(null)}>Done</Button>
                    </div>
                </div>
            )}
            <KeyTable/>
        </main>
    );
}
