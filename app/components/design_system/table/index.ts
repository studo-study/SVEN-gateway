import type {ReactNode} from "react";

export interface IColumn<T> {
    title: string;
    width: string;
    render: (row: T) => ReactNode;
    className?: string;
}

export interface ITableHeader {
    columns: Pick<IColumn<unknown>, "title" | "width">[];
}

export interface ITableProps<T> {
    columns: IColumn<T>[];
    rows: T[];
    rowKey: (row: T) => string;
}

export interface IDetailViewProps {

}
