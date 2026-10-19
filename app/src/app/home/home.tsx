import {PageTitle} from "~/components/design_system/pageTitle/PageTitle";
import type {Route} from "./+types/home";

type StatType = {
    label: string;
    value: number;
}

export function meta({}: Route.MetaArgs) {
    return [
        {title: "Home - SVEN gateway"},
        {name: "description", content: "Welcome to React Router!"},
    ];
}

const DashboardStats = () => {
    const stats: StatType[] = [
        {
            label: 'Queued job count',
            value: 0
        },
        {
            label: 'Max concurrency',
            value: 0
        },
        {
            label: 'LLM cache count',
            value: 0
        },
        {
            label: 'Job cache count',
            value: 0
        },
    ]

    return (<div className={'w-full h-fit flex gap-5 flex-row flex-wrap md:justify-between items-center'}>
        {stats.map((stat, index) => {
            return (<div className={'flex flex-col gap-1.5 w-[calc(50%-0.625rem)] md:w-1/5 h-10 mb-3'} key={stat.label + index}>
                <h3 className={'text-sm text-neutral-400'}>{stat.label}</h3>
                <span>{stat.value}</span>
            </div>)
        })}
    </div>)
}

export default function Home() {
    return <main className={"flex flex-col"}>
        <PageTitle title={'Dashboard'}/>
        <DashboardStats/>
    </main>;
}
