import {type RouteConfig, index, route, layout} from "@react-router/dev/routes";

export default [
    layout("src/app/RootLayout.tsx", [
        index("src/app/home/home.tsx"),
        route("activity", "src/app/activity/Activity.tsx"),
        route("api-keys", "src/app/api-keys/ApiKeys.tsx"),
        route("settings", "src/app/settings/Settings.tsx"),
        route("usage", "src/app/usage/Usage.tsx"),
        route("notifications", "src/app/notifications/Notifications.tsx"),
        route("account", "src/app/account/Account.tsx"),
        route("operations", "src/app/operations/Operations.tsx"),
        route('models', "src/app/models/Models.tsx")
    ]),
    route("login", 'src/auth/login/Login.tsx')
] satisfies RouteConfig;
