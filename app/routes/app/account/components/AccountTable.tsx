import {Copy} from "lucide-react";
import {useMe} from "~/auth/auth";
import classNames from "~/utils/classNames";

export const AccountTable: React.FC = () => {
    const {data: user} = useMe();

    const userInfo = [
        {
            title: "User ID",
            value: user?.id,
            handleCopy: () => {
                navigator.clipboard.writeText(user?.id ?? "");
            }
        },

        {
            title: "Email",
            value: user?.email,
            handleCopy: () => {
                navigator.clipboard.writeText(user?.email ?? "");
            }
        },


        {
            title: "Session token",
            value: user?.token,
            handleCopy: () => {
                navigator.clipboard.writeText(user?.token ?? "");
            }
        }
    ]
    return(<div className={"w-full h-fit flex-col divide-y divide-neutral-200 gap-3 border border-neutral-200 mb-3 rounded-3xl p-5 bg-white"}>

        {
            userInfo.map((item, index) => {
                return(
                    <div
                        key={item.title + index}
                        className={classNames("w-full h-10 py-3 flex flex-row justify-between items-center"
                        )}>
                        <span className={"font-medium min-w-0 flex-1"}>{item.title}</span>
                        <div className={"text-neutral-500 flex flex-row gap-2 justify-end items-center min-w-0 flex-1"}>
                            <span className={"max-w-1/3 w-full truncate overflow-hidden"}>{item.value}</span>
                            <button
                                type="button"
                                className={"active:scale-90 transition-transform duration-300 cursor-pointer"}
                                onClick={item.handleCopy}
                            >
                                <Copy size={15}/>
                            </button>
                        </div>
                    </div>

                )
            })
        }

    </div>)
}

AccountTable.displayName = "AccountTable";