import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Home - SVEN gateway" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return <main>homepage</main>;
}
