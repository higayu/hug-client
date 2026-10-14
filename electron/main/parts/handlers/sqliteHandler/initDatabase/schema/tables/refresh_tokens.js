const SQL = `
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" INTEGER NOT NULL,
    "staff_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TEXT NOT NULL,
    "revoked_at" TEXT DEFAULT NULL,
    "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("id" AUTOINCREMENT),
    UNIQUE("token_hash"),
    CONSTRAINT "fk_refresh_tokens_staff"
        FOREIGN KEY("staff_id")
        REFERENCES "staffs"("id")
        ON DELETE CASCADE
);
`;

module.exports = SQL;
