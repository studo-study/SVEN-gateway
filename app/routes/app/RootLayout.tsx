import {Link, Outlet} from "react-router";
import SvenIcon from "~/components/icons/SvenIcon";
import SideMenu from "~/components/layout/SideMenu";
import {Bell, User} from "lucide-react";

export default function RootLayout() {
    return (
        <div className={"flex flex-col w-screen h-screen"}>
            <header
                className={"w-screen bg-neutral-50-500 min-h-20 h-20 border-b border-neutral-200 px-3 pr-5 flex items-center justify-between"}>
                <Link to="/"
                      className={"flex flex-row gap-2 items-center px-3 py-1.5 rounded-2xl hover:bg-neutral-200/50 transition-colors duration-300"}>
                    <SvenIcon size={23} className={"pb-1"}/>
                    <h1 className={"text-2xl font-georgia font-medium"}><span
                        className={"text-blue-500"}>Sven</span> gateway</h1>
                </Link>

                <div className={"flex flex-row gap-2 items-center"}>
                    <Link to={"/notifications"}
                          title={"notifications"}
                          className={"w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-200/50 transition-colors duration-300"}>
                        <Bell size={15}/>
                    </Link>
                    <Link to={"/account"}
                          title={"account"}
                          className={"w-10 h-10 border border-neutral-200 bg-white flex items-center justify-center rounded-full hover:bg-neutral-200/50 transition-colors duration-300"}>
                        <User size={15}/>
                    </Link>
                </div>
            </header>
            <div className={"min-w-0 min-h-0 flex-1 flex flex-row"}>
                <SideMenu/>
                <div className={"min-w-0 min-h-0 flex flex-1 flex-col p-10 pt-11.5"}>
                    <Outlet/>
                </div>
            </div>
        </div>
    );
}
