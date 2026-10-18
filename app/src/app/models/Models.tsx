import {PageTitle} from "~/components/design_system/pageTitle/PageTitle"
import {useCreateModel, useModels} from "~/hooks/useModels";
import type {FullModelResponse} from "../../../../models/models/models";
import {Tag} from "~/components/design_system/tag/Tag";
import {Cable, CodeXml, Eye, HardDrive, Plus} from "lucide-react";
import classNames from "~/utils/classNames";
import Button from "~/components/design_system/button/Button";
import Input from "~/components/input/Input";
import {useState} from "react";
import BaseDialog from "~/components/design_system/dialog/Dialog";
import InputSelect from "~/components/design_system/select/InputSelect";


const MODEL_TYPES = ["chat", "generation", "embedding"];
const PROVIDERS = ["anthropic", "open_ai", "google", "meta_ai", "microsoft", "amazon", "xAi", "mistral", "deepseek", "alibaba", "cohere", "baidu", "tencent", "moonshot"];
const PLATFORMS = ["anthropic_api", "openai_api", "google_gemini_api", "xai_api", "mistral_api", "deepseek_api", "alibaba_model_studio", "cohere_api", "baidu_qianfan", "tencent_hunyuan_api", "moonshot_api", "google_vertex_ai", "microsoft_foundry", "azure_openai", "amazon_bedrock", "openrouter", "together_ai", "groq", "fireworks_ai", "cerebras"];

const toOptions = (values: string[]) =>
    values.map((value) => ({
        value,
        label: value
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase())
            .replace("Api", "API")
            .replace("ai", "AI")
            .replace("Ai", "AI"),
    }));

const dollarsToCents = (dollars: string) =>
    dollars.trim() === "" ? undefined : Math.round(Number(dollars) * 100);

const AddModel = () => {
    const createModel = useCreateModel();
    const [name, setName] = useState("");
    const [modelType, setModelType] = useState("chat");
    const [provider, setProvider] = useState("");
    const [platform, setPlatform] = useState("");
    const [url, setUrl] = useState("");
    const [input, setInput] = useState("");
    const [output, setOutput] = useState("");
    const [cached, setCached] = useState("");
    const [context, setContext] = useState("");
    const [maxOutput, setMaxOutput] = useState("");
    const [vision, setVision] = useState("no");

    const reset = () => {
        setName(""); setProvider(""); setPlatform(""); setUrl("");
        setInput(""); setOutput(""); setCached("");
        setContext(""); setMaxOutput(""); setVision("no");
    };

    const handleCreate = () =>
        createModel.mutate({
            modelName: name.trim(),
            modelType,
            provider,
            platform,
            endpointUrl: url.trim() || undefined,
            inputCostPm: dollarsToCents(input),
            outputCostPm: dollarsToCents(output),
            cachedCostPm: dollarsToCents(cached),
            contextWindow: context.trim() || undefined,
            maxOutput: maxOutput.trim() || undefined,
            vision: vision === "yes",
        }, {onSuccess: reset});

    return (
        <BaseDialog
            trigger={<Button iconLeft={<Plus size={12}/>} size={"sm"} className={"min-w-fit"}>Add model</Button>}
            content={
                <div className={"max-w-200 min-w-150 mb-3 w-full h-fit flex flex-col"}>
                    <h2 className={"font-medium mb-3"}>Create model</h2>
                    <p className={"text-sm text-neutral-400 mb-3"}>
                        Add a model to the garden. Prices are in dollars per 1M tokens.
                    </p>
                    <div className={"grid grid-cols-2 gap-3"}>
                        <Input label={"Model name"} value={name} onChange={setName} placeholder={"claude-sonnet-5-5"}/>
                        <Input label={"Endpoint url"} value={url} onChange={setUrl} placeholder={"https://api.anthropic.com"}/>
                        <InputSelect label={"Type"} size={"lg"} value={modelType} options={toOptions(MODEL_TYPES)}
                                onChange={(v) => setModelType(String(v))}/>
                        <InputSelect label={"Vision"} size={"lg"} value={vision}
                                options={[{value: "yes", label: "yes"}, {value: "no", label: "no"}]}
                                onChange={(v) => setVision(String(v))}/>
                        <InputSelect label={"Provider"} size={"lg"} value={provider} options={toOptions(PROVIDERS)}
                                placeholder={"select provider..."} onChange={(v) => setProvider(String(v))}/>
                        <InputSelect label={"Platform"} size={"lg"} value={platform} options={toOptions(PLATFORMS)}
                                placeholder={"select platform..."} onChange={(v) => setPlatform(String(v))}/>
                        <Input label={"Input $ / 1M"} value={input} onChange={setInput} placeholder={"3.00"}/>
                        <Input label={"Output $ / 1M"} value={output} onChange={setOutput} placeholder={"15.00"}/>
                        <Input label={"Cached $ / 1M"} value={cached} onChange={setCached} placeholder={"0.30"}/>
                        <Input label={"Context window"} value={context} onChange={setContext} placeholder={"200K"}/>
                        <Input label={"Max output"} value={maxOutput} onChange={setMaxOutput} placeholder={"64K"}/>
                    </div>
                    {createModel.isError && <p className={"text-xs text-rose-500 mt-3"}>{createModel.error.message}</p>}
                </div>
            }
            close={<Button variant={"ghost"}>Close</Button>}
            next={
                <Button
                    disabled={!name.trim() || !provider || !platform}
                    onClick={handleCreate}
                    variant={"secondary"}>
                    Create
                </Button>
            }
        />
    )
}

const formatPricePerMillion = (cents: number | null) =>
    cents == null ? "–" : `$${(cents / 100).toFixed(2)} / 1M`;

interface IModelGridItemProps {
    model: FullModelResponse;
}

const ModelGridItem: React.FC<IModelGridItemProps> = ({model}) => {
    const [url, setUrl] = useState<string>("");
    const [key, setKey] = useState<string>("");

    const handleUpload = () => {

    }
    return (<div
        className={classNames("h-fit w-full border border-neutral-200 p-4 shadow-sm rounded-2xl flex flex-col gap-3", !model.active && "saturate-0")}>
        <div className={"flex flex-row justify-between items-center text-sm"}>
            <span className={"font-medium"}>
             {model.modelName}
            </span>
            {model.active && <Tag label={"• active"} tagColor={"green"} tagSize={"sm"}/>}
        </div>

        <div className={"flex flex-row items-center gap-2"}>
            {model.platform &&
                <Tag
                    label={model.platform.replaceAll("_", " ").replace("api", "API") ?? ""}
                    tagColor={"yellow"}
                    tagSize={"sm"}
                    iconLeft={<HardDrive size={9}/>}
                />}

            {model.vision &&
                <Tag
                    label={"Vision"}
                    tagColor={"blue"}
                    tagSize={"sm"}
                    iconLeft={<Eye size={9}/>}
                />}

            {model.modelType === "embedding" &&
                <Tag
                    label={"Embedding"}
                    tagColor={"red"}
                    tagSize={"sm"}
                    iconLeft={<CodeXml size={9}/>}
                />}
        </div>


        <hr className={"border-neutral-200"}/>

        <div className={"flex flex-col gap-2 text-[11px] text-neutral-600"}>

            <div className={"flex flex-row justify-between items-center"}>
                <span>Input</span>
                <span>{formatPricePerMillion(model.inputCostPm)}</span>
            </div>

            <div className={"flex flex-row justify-between items-center"}>
                <span>Cached</span>
                <span>{formatPricePerMillion(model.cachedCostPm)}</span>
            </div>

            <div className={"flex flex-row justify-between items-center"}>
                <span>Output</span>
                <span>{formatPricePerMillion(model.outputCostPm)}</span>
            </div>

            <div className={"flex flex-row justify-between items-center"}>
                <span>Context</span>
                <span>{model.contextWindow}</span>
            </div>

            <div className={"flex flex-row justify-between items-center"}>
                <span>Max output</span>
                <span>{model.maxOutput}</span>
            </div>

        </div>

        <hr className={"border-neutral-200"}/>

        <div className={"flex flex-row justify-end"}>
            <BaseDialog
                trigger={<Button
                            iconLeft={<Cable size={12}/>}
                            variant={"secondary"}
                            size={"sm"}>
                            {model.endpointUrl ? "reconfigure" : "configure"}
                        </Button>}
                content={
                <div className={"max-w-200 min-w-150 mb-3 w-full h-fit flex flex-col"}>
                    <h2 className={"font-medium capitalize mb-3"}>Configure {model.platform?.replaceAll("_", " ").replace("api", "API")}</h2>
                    <p className={"text-sm text-neutral-400 mb-3"}>
                        Provide the <span className={"capitalize"}>{model.platform?.replaceAll("_", " ").replace("api", "API")}</span> endpoint and API key for
                        <span className={"lowercase"}> {model.modelName?.replaceAll("_", " ")}</span>.
                    </p>
                    <div className={"flex flex-col gap-3"}>
                    <Input value={url} onChange={(input) => setUrl(input)} placeholder={"endpoint url..."}/>
                    <Input value={key} onChange={(input) => setKey(input)} placeholder={"api key..."}/>
                    </div>
                </div>
                }

                close={
                <Button variant={"ghost"}>Close</Button>
                }
                next={
                <Button variant={"secondary"}>{model.endpointUrl ? "Redeploy" : "Deploy"}</Button>
                }
            />
        </div>
    </div>)
}

export default function Models() {
    const models = useModels().data?.models;
    return (<main className={"flex flex-col pb-3 overflow-y-scroll scroll-hidden"}>
            <div className={"flex flex-row justify-between items-center"}>
                <PageTitle title={"Model garden"}/>
                <AddModel/>
            </div>
            <span className={"mb-2 text-sm font-medium w-fit flex flex-row gap-2"}>Active models:
                <Tag
                    label={models?.filter(model => model.active).length.toString() ?? "0"}
                    tagColor={"neutral"}
                    tagSize={"sm"}
                    shape={"square"}
                />
            </span>
            <div className={"mb-20 grid grid-cols-4 gap-4"}>
                {models?.filter(model => model.active).map((model) => (
                    <ModelGridItem key={model.id} model={model}/>
                ))}
            </div>

            <span className={"mb-1 text-sm font-medium w-fit flex flex-row gap-2"}>Depricated models:
                <Tag
                    label={models?.filter(model => !model.active).length.toString() ?? "0"}
                    tagColor={"neutral"}
                    tagSize={"sm"}
                    shape={"square"}
                />
        </span>
            <p className={"flex mb-4 text-xs text-neutral-400"}>

                Models marked as outdated, even though they still function temporarily. Always set a replacement when shelving models.
            </p>
            <div className={"grid grid-cols-4 gap-4"}>
                {models?.filter(model => !model.active).map((model) => (
                    <ModelGridItem key={model.id} model={model}/>
                ))}
            </div>
        </main>
    )
}