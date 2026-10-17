import {PageTitle} from "~/components/design_system/pageTitle/PageTitle"
import {useModels} from "~/hooks/useModels";
import type {FullModelResponse} from "../../../../models/models/models";
import {Tag} from "~/components/design_system/tag/Tag";
import {Cable, CodeXml, Eye, HardDrive} from "lucide-react";
import classNames from "~/utils/classNames";
import Button from "~/components/design_system/button/Button";
import Input from "~/components/input/Input";
import {useState} from "react";
import BaseDialog from "~/components/design_system/dialog/Dialog";


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
            <PageTitle title={"Model garden"}/>
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