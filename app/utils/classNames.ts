import { twMerge } from "tailwind-merge";
import {type ClassValue, clsx } from "clsx";

function classNames(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default classNames;
