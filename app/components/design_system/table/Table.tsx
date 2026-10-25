import type {ITableProps} from "~/components/design_system/table/index";
import TableHeader from "~/components/design_system/table/TableHeader";
import classNames from "~/utils/classNames";

const Table = <T, >({columns, rows, rowKey}: ITableProps<T>) => {
    const template = columns.map((col) => col.width).join(" ");

    return (<div className={"overflow-x-auto"}>
        <div className={"flex flex-col min-w-200"}>
            <TableHeader columns={columns}/>
            <div
                className={"border-b border-l border-r rounded-bl-xl rounded-br-xl border-neutral-200 min-h-10 flex flex-col divide-y divide-neutral-200"}>
                {rows.map((row) => (
                    <div key={rowKey(row)} style={{gridTemplateColumns: template}}
                         className={"grid items-center text-sm"}>
                        {columns.map((col) => (
                            <div key={col.title} className={classNames("px-3 py-2", col.className)}>
                                {col.render(row)}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    </div>)
}

export default Table;
