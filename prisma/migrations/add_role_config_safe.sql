-- Create RoleConfig table without dropping anything
CREATE TABLE IF NOT EXISTS "RoleConfig" (
    id SERIAL PRIMARY KEY,
    "roleName" VARCHAR(100) UNIQUE NOT NULL,
    "roleId" VARCHAR(100) NOT NULL,
    threshold INTEGER,
    "collectionName" VARCHAR(100),
    "roleType" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add the table to Prisma's migration table
INSERT INTO "_prisma_migrations" (checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES (
    'add_role_config_safe',
    CURRENT_TIMESTAMP,
    '20240312000000_add_role_config_safe',
    NULL,
    NULL,
    CURRENT_TIMESTAMP,
    1
); 