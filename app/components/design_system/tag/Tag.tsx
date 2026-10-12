import type {ReactNode} from "react";
import classNames from "~/utils/classNames";

type TagSize = "sm" | "md" | "lg"

const sizeMap = {
    sm: "px-2.5 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-sm",
    lg: "px-2.5 py-1.5 text-base",
} as const;

type TagColor = "blue" | "yellow" | "orange" | "pink" | "red" | "green" | "neutral";

const colorMap = {
    blue: "bg-blue-200 text-blue-700",
    yellow: "bg-amber-100 text-amber-600",
    orange: "bg-orange-200 text-orange-700",
    pink: "bg-pink-200 text-pink-700",
    red: "bg-rose-200 text-rose-700",
    green: "bg-green-200 text-green-700",
    neutral: "bg-neutral-100 text-neutral-500"
} as const;


type Shape = "rectangle" | "square" | "circle";

const shapeMap = {
    rectangle: "rounded-full",
    square: "justify-center rounded-lg p-0",
    circle: "justify-center rounded-full p-0",
} as const;

const equalSizeMap = {
    sm: "size-5",
    md: "size-7",
    lg: "size-9",
} as const;


interface ITagProps {
    iconLeft?: ReactNode;
    label: string;
    tagColor?: TagColor;
    tagSize?: TagSize
    shape?: Shape;
}


export const Tag: React.FC<ITagProps> = (props) => {
    const {iconLeft, label, tagColor = "blue", tagSize = "md", shape = "rectangle"} = props;
    return (
        <div className={classNames("flex capitalize flex-row gap-1 items-center",
            colorMap[tagColor],
            sizeMap[tagSize],
            shape !== "rectangle" && equalSizeMap[tagSize],
            shapeMap[shape]
        )}>
            {iconLeft}
            {label}
        </div>)
}

Tag.displayName = "Tag"