import {useEffect, useState} from "react";
import {Link, Outlet, useLocation} from "react-router";
import SvenIcon from "~/components/icons/SvenIcon";
import SideMenu from "~/components/layout/SideMenu";
import {Bell, Menu, User, X} from "lucide-react";
import {authMiddleware} from "~/middleware";

export const middleware = [authMiddleware];

export function headers() {
    return {"Cache-Control": "no-store"};
}

export default function RootLayout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const {pathname} = useLocation();
    useEffect(() => setMenuOpen(false), [pathname]);
    return (
        <div className={"flex flex-col w-full h-dvh"}>
            <header
                className={"w-full bg-neutral-50-500 min-h-15 h-15 border-b border-neutral-200 px-3 pr-3 sm:pr-5 gap-2 flex items-center justify-between"}>
                <button type="button" aria-label="menu" onClick={() => setMenuOpen(o => !o)}
                        className={"md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-neutral-200/50"}>
                    {menuOpen ? <X size={18}/> : <Menu size={18}/>}
                </button>
                <Link to="/"
                      className={"flex flex-row gap-2 items-center px-3 py-1.5 mr-auto rounded-2xl hover:bg-neutral-200/50 transition-colors duration-300"}>
                    <SvenIcon size={20} className={"pb-1"}/>
                    <h1 className={"text-xl font-georgia font-medium"}><span
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
                {menuOpen && <div className={"md:hidden fixed inset-0 top-15 z-40 bg-black/30"} onClick={() => setMenuOpen(false)}/>}
                <SideMenu open={menuOpen}/>
                <div className={"min-w-0 min-h-0 flex flex-1 flex-col p-4 pt-6 sm:p-6 md:p-10 md:pt-11.5"}>
                    <Outlet/>
                </div>
            </div>
        </div>
    );
}
