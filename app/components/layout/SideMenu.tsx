import {Link, useLocation, useNavigate, useNavigation} from "react-router";
import {ChartColumn, ChartLine, Cog, Database, Key, LayoutDashboard} from "lucide-react";


const MENU_ITEMS = [
    {
        title: "overview",
        options: [
            {
                label: "dashboard",
                to: "",
                icon: <LayoutDashboard size={15}/>
            },
        ]
    },

    {
        title: "user-activity",
        options: [
            {
                label: "activity",
                to: "activity",
                icon: <ChartLine size={15}/>
            },
            {
                label: "usage",
                to: "usage",
                icon: <ChartColumn size={15}/>
            },
        ]
    },

    {
        title: "configuration",
        options: [
            {
                label: "api-keys",
                to: "api-keys",
                icon: <Key size={15}/>
            },
            {
                label: "operations",
                to: "operations",
                icon: <Database size={15}/>
            },
            {
                label: "settings",
                to: "settings",
                icon: <Cog size={15}/>
            },
        ]
    },

]
const SideMenu = () => {
    const path = useLocation().pathname.replace("/", "");
    console.log(path)
    return (<div
        className={"max-w-55 bg-neutral-50 min-w-0 min-h-0 flex-1 border-r border-neutral-200 flex flex-col p-5 gap-1"}>
        {
            MENU_ITEMS.map((section, index) => (
                <div className={"flex flex-col gap-1 w-full mb-5"}>
                    <span className={"text-[10px] px-3 text-neutral-400 tracking-wider uppercase"}>{section.title}</span>
                    {section.options.map((item, index) => {
                        return (
                            <Link to={"/" + item.to} key={item.label + index}
                                  className={`${path.toLowerCase() === item.to && "bg-neutral-200/50"} flex flex-row gap-2 capitalize items-center text-base rounded-2xl px-3 py-2 hover:transition-colors duration-300 hover:bg-neutral-200/50`}>
                                {item.icon}
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            ))
        }
    </div>)
}

SideMenu.displayName = "SideMenu"
export default SideMenu;
