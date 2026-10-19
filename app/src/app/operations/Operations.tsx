import type {Route} from "./+types/Operations";
import {PageTitle} from "~/components/design_system/pageTitle/PageTitle";
import {useCreateOperation, useOperations, useUpdateOperation} from "~/hooks/useOperations";
import {useModels} from "~/hooks/useModels";
import {Tag} from "~/components/design_system/tag/Tag";
import {CodeXml, MessageSquare, Pencil, Plus, Sparkles} from "lucide-react";
import Button from "~/components/design_system/button/Button";
import Input from "~/components/input/Input";
import InputSelect from "~/components/design_system/select/InputSelect";
import BaseDialog from "~/components/design_system/dialog/Dialog";
import classNames from "~/utils/classNames";
import {useState} from "react";
import type {OperationResponse} from "../../../../models/models/models";

export function meta({}: Route.MetaArgs) {
    return [
        {title: "Operations - SVEN Gateway"},
        {name: "description", content: "Operations and the models they run on"},
    ];
}

const OPERATION_TYPES = ["course_embedding", "studoset_generation", "visualset_generation", "suggestion_generation", "chat", "course_summarizing", "progression_tracking"];
const MODEL_TYPES = ["chat", "generation", "embedding"];

const toOptions = (values: string[]) =>
    values.map((value) => ({value, label: value.replaceAll("_", " ")}));

const typeTag = (operationType: string) => {
    switch (operationType) {
        case "course_embedding":
            return {color: "red", icon: <CodeXml size={9}/>} as const;
        case "chat":
            return {color: "blue", icon: <MessageSquare size={9}/>} as const;
        default:
            return {color: "yellow", icon: <Sparkles size={9}/>} as const;
    }
};

const textareaClass = "w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 ring-black resize-y font-mono";

interface IOperationDialogProps {
    trigger: React.ReactNode;
    // set to edit an existing operation, omit to create
    operation?: OperationResponse;
}

const OperationDialog: React.FC<IOperationDialogProps> = ({trigger, operation}) => {
    const createOperation = useCreateOperation();
    const updateOperation = useUpdateOperation();
    const mutation = operation ? updateOperation : createOperation;
    const models = useModels().data?.models;
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [operationType, setOperationType] = useState("chat");
    const [modelType, setModelType] = useState("chat");
    const [modelId, setModelId] = useState("");
    const [systemPrompt, setSystemPrompt] = useState("");
    const [isActive, setIsActive] = useState("yes");

    // prefill from the saved operation (edit) or blank (create) every time the dialog opens
    const fill = () => {
        setTitle(operation?.title ?? "");
        setSlug(operation?.slug ?? "");
        setOperationType(operation?.operationType ?? "chat");
        setModelType(operation?.modelType ?? "chat");
        setModelId(operation?.modelId ?? "");
        setSystemPrompt(operation?.systemPrompt ?? "");
        setIsActive(operation?.isActive === false ? "no" : "yes");
        mutation.reset();
    };

    const modelOptions = (models ?? [])
        .filter((model) => (model.active || model.id === modelId) && model.modelType === modelType)
        .map((model) => ({
            value: model.id,
            label: `${model.modelName} (${model.platform?.replaceAll("_", " ")})`,
        }));

    const handleSave = () => {
        const body = {
            title: title.trim(),
            slug: slug.trim(),
            operationType,
            modelType,
            modelId: modelId || undefined,
            // keep the system prompt verbatim (no trim): whitespace can be meaningful, and it can be huge
            systemPrompt: systemPrompt || undefined,
            isActive: isActive === "yes",
        };
        if (operation) updateOperation.mutate({id: operation.id, ...body});
        else createOperation.mutate(body);
    };

    return (
        <BaseDialog
            onOpenChange={(open) => open && fill()}
            trigger={trigger}
            content={
                <div className={"w-200 max-w-[calc(100vw-4rem)] mb-3 h-fit flex flex-col"}>
                    <h2 className={"font-medium mb-3"}>{operation ? `Edit ${operation.title}` : "Create operation"}</h2>
                    <p className={"text-sm text-neutral-400 mb-3"}>
                        An operation runs a prompt on a model. The slug must be unique.
                    </p>
                    <div className={"flex-1 min-h-0 overflow-y-auto px-2 scroll-hidden pb-1"}>
                        <div className={"grid grid-cols-1 sm:grid-cols-2 gap-3"}>
                            <Input label={"Title"} value={title} onChange={setTitle} placeholder={"Course summarizing"}/>
                            <Input label={"Slug"} value={slug} onChange={setSlug} placeholder={"course-summarizing"}/>
                            <InputSelect label={"Operation type"} size={"lg"} value={operationType}
                                         options={toOptions(OPERATION_TYPES)}
                                         onChange={(v) => setOperationType(String(v))}/>
                            <InputSelect label={"Model type"} size={"lg"} value={modelType}
                                         options={toOptions(MODEL_TYPES)}
                                         onChange={(v) => {
                                             setModelType(String(v));
                                             setModelId("");
                                         }}/>
                            <InputSelect label={"Model"} size={"lg"} value={modelId} options={modelOptions}
                                         placeholder={"select model..."}
                                         onChange={(v) => setModelId(String(v))}/>
                            <InputSelect label={"Active"} size={"lg"} value={isActive}
                                         options={[{value: "yes", label: "yes"}, {value: "no", label: "no"}]}
                                         onChange={(v) => setIsActive(String(v))}/>
                            <label className={"sm:col-span-2 flex flex-col"}>
                                <span className={"flex justify-between text-xs px-3 text-neutral-400 mb-1"}>
                                    System prompt <span>{systemPrompt.length.toLocaleString()} chars</span>
                                </span>
                                <textarea className={textareaClass} rows={22} value={systemPrompt}
                                          onChange={(e) => setSystemPrompt(e.target.value)}
                                          placeholder={"system prompt..."}/>
                            </label>
                        </div>
                    </div>
                    {mutation.isError && <p className={"text-xs text-rose-500 mt-3"}>{mutation.error.message}</p>}
                </div>
            }
            close={<Button variant={"ghost"}>Close</Button>}
            next={
                <Button disabled={!title.trim() || !slug.trim()} onClick={handleSave} variant={"secondary"}>
                    {operation ? "Save" : "Create"}
                </Button>
            }
        />
    );
};

interface IOperationItemProps {
    operation: OperationResponse;
    modelName?: string | null;
}

const OperationItem: React.FC<IOperationItemProps> = ({operation, modelName}) => {
    const tag = typeTag(operation.operationType);
    return (
        <div className={classNames(
            "border border-neutral-200 rounded-2xl w-full min-w-0 h-fit flex flex-col p-4 gap-3 shadow-sm overflow-hidden",
            !operation.isActive && "saturate-0")}>
            <div className={"flex flex-row justify-between items-center gap-2"}>
                <Tag
                    label={operation.operationType.replaceAll("_", " ")}
                    iconLeft={tag.icon}
                    tagColor={tag.color}
                    tagSize={"sm"}
                />
                {operation.isActive && <Tag label={"• active"} tagColor={"green"} tagSize={"sm"}/>}
            </div>
            <div className={"flex flex-col"}>
                <h3 className={"font-medium text-sm truncate"}>{operation.title}</h3>
                <span className={"text-[11px] text-neutral-400 truncate"}>{operation.slug}</span>
            </div>
            <hr className={"border-neutral-200"}/>
            <div className={"flex flex-row justify-between items-center text-[11px] text-neutral-600"}>
                <span>Model</span>
                <span className={"truncate ml-2"}>{modelName ?? "–"}</span>
            </div>
            <p className={"text-[11px] text-neutral-400 line-clamp-1 break-words"}>
                {operation.systemPrompt ?? "No system prompt set"}
            </p>
            <div className={"flex flex-row justify-end"}>
                <OperationDialog
                    operation={operation}
                    trigger={<Button iconLeft={<Pencil size={12}/>} variant={"secondary"} size={"sm"}>Edit</Button>}
                />
            </div>
        </div>
    );
};

export default function Operations() {
    const operations = useOperations().data?.operations;
    const models = useModels().data?.models;
    const modelName = (id: string | null) => models?.find((model) => model.id === id)?.modelName;

    return (
        <main className={"flex flex-col pb-3 overflow-y-scroll overflow-x-hidden scroll-hidden"}>
            <PageTitle title={"Operations"} actions={  <OperationDialog trigger={<Button iconLeft={<Plus size={12}/>} size={"sm"} className={"min-w-fit m-0"}>Create operation</Button>}/>}/>
            <div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4"}>
                {operations?.map((operation) => (
                    <OperationItem key={operation.id} operation={operation} modelName={modelName(operation.modelId)}/>
                ))}
            </div>
        </main>
    );
}
