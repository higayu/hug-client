const SQL = `
CREATE TABLE IF NOT EXISTS "staffs" (
    "id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "login_id" TEXT DEFAULT NULL,
    "password_hash" TEXT DEFAULT NULL,
    "work_style" TEXT DEFAULT NULL,
    "notes" TEXT DEFAULT '',
    "is_delete" INTEGER NOT NULL DEFAULT 0,
    "role_id" INTEGER NOT NULL DEFAULT 0,
    "display_order" INTEGER DEFAULT NULL,
    "entered_at" TEXT DEFAULT NULL,
    "leaving_at" TEXT DEFAULT NULL,
    "hug_updated_at" TEXT DEFAULT NULL,
    "hug_updated_by" TEXT DEFAULT NULL,
    "created_at" TEXT DEFAULT NULL,
    "updated_at" TEXT DEFAULT NULL,
    PRIMARY KEY("id"),
    UNIQUE("login_id")
);
`;

module.exports = SQL;
