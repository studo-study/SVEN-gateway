import {type RouteConfig, index, route, layout} from "@react-router/dev/routes";

export default [
    layout("routes/app/RootLayout.tsx", [
        index("routes/app/home/home.tsx"),
        route("activity", "routes/app/activity/Activity.tsx"),
        route("api-keys", "routes/app/api-keys/ApiKeys.tsx"),
        route("settings", "routes/app/settings/Settings.tsx"),
        route("usage", "routes/app/usage/Usage.tsx"),
        route("notifications", "routes/app/notifications/Notifications.tsx"),
        route("account", "routes/app/account/Account.tsx"),
        route("operations", "routes/app/operations/Operations.tsx"),
    ]),
    route("login", 'routes/auth/login/Login.tsx')
] satisfies RouteConfig;
