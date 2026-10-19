import * as React from "react";
import {Dialog} from "radix-ui";
import {XIcon} from "lucide-react";
import type {ReactNode} from "react";
import Button from "~/components/design_system/button/Button";

interface IBaseDialogProps {
    trigger: ReactNode;
    content: ReactNode;
    close?: ReactNode;
    next?: ReactNode;
    onOpenChange?: (open: boolean) => void;
}

const BaseDialog: React.FC<IBaseDialogProps> = (props) => {
    const {trigger, content, close, next, onOpenChange} = props;
    return (
        <Dialog.Root onOpenChange={onOpenChange}>
            <Dialog.Trigger asChild>
                {trigger}
            </Dialog.Trigger>
            <Dialog.Portal>
                <Dialog.Overlay className="bg-black/40 fixed inset-0 z-999"/>
                <Dialog.Content
                    className="bg-white max-w-[calc(100vw-1.5rem)] sm:max-w-230 max-h-[90vh] overflow-y-auto overflow-x-hidden h-fit w-fit px-4 sm:px-10 py-5 pt-10 border border-neutral-200 rounded-2xl fixed z-9999 left-1/2 top-1/2 -translate-1/2">
                    {content}
                    <div className={"flex flex-row justify-end w-full gap-2 items-center"}>
                        {close && <Dialog.Close asChild>
                            {close}
                        </Dialog.Close>}

                        {next && <Dialog.Close asChild>
                            {next}
                        </Dialog.Close>}
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}


BaseDialog.displayName = "BaseDialog"
export default BaseDialog;
