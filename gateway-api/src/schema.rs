diesel::table! {
    users (id) {
        id -> Int4,
        name -> Varchar,
        body -> Text,
        published -> Bool,
    }
}