import type {ITableHeader} from "~/components/design_system/table/index";

const TableHeader: React.FC<ITableHeader> = ({columns}) => {
    return (<div
        style={{gridTemplateColumns: columns.map((col) => col.width).join(" ")}}
        className={"grid h-8 border-b border-neutral-200 bg-neutral-100 rounded-tl-xl rounded-tr-xl"}
    >
        {columns.map((col) => (
            <div
                key={col.title}
                className={"flex flex-row px-3 h-8 items-center tracking-wider uppercase text-[11px] text-neutral-400"}>
                {col.title}
            </div>
        ))}
    </div>)
}

TableHeader.displayName = "TableHeader";
export default TableHeader;
