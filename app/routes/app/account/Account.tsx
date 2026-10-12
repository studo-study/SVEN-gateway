import type {Route} from "./+types/Account";
import Button from "~/components/design_system/button/Button";
import {useLogout} from "~/auth/auth";
import {LogOut} from "lucide-react";
import {useNavigate} from "react-router";
import {PageTitle} from "~/components/design_system/pageTitle/PageTitle";
import {AccountTable} from "~/routes/app/account/components/AccountTable";

export function meta({}: Route.MetaArgs) {
    return [
        {title: "Account - SVEN Gateway"},
        {name: "description", content: "About this app"},
    ];
}

export function loader() {
    return {message: "Hello from the about loader"};
}

export default function Account({loaderData}: Route.ComponentProps) {
    const navigate = useNavigate();
    const logout = useLogout();

    return (
        <main className={"min-w-0 min-h-0 flex-1 flex items-center justify-center"}>
            <div className={"max-w-220 min-h-0 h-full flex-col flex-1 flex min-w-0"}>
                <PageTitle title={"Account"}/>
                <AccountTable/>
                <div className={"flex justify-end"}>
                    <Button variant={"primary"}
                            isLoading={logout.isPending}
                            onClick={() => logout.mutate(undefined, {onSuccess: () => navigate("/login")})}
                            iconRight={<LogOut size={14}/>}>
                        Log out
                    </Button>
                </div>
            </div>
        </main>
    );
}
