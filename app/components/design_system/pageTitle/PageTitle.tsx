import type {ReactNode} from "react";

interface IPageTitleProps {
    title: string;
    actions?: ReactNode;
    tabs?: ReactNode;
    filters?: ReactNode;
}

export const PageTitle: React.FC<IPageTitleProps> = (props) => {
    const {title, actions, tabs, filters} = props;
    return (<div className={"w-full flex flex-col mb-3"}>
        <div className={"min-w-0 max-h-fit flex-1 flex justify-between items-start"}>
            <h1 className={"text-lg font-semibold"}>{title}</h1>
            {actions}
        </div>

        <div>
            {tabs}
        </div>
        <div>
            {filters}
        </div>

    </div>)
}


PageTitle.displayName = "PageTitle";