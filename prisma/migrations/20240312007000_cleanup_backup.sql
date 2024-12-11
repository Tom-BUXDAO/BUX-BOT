-- Drop the backup table since we've verified the conversion
DROP TABLE IF EXISTS "RoleConfig_backup";

-- Double check the threshold values are correct
SELECT "roleName", threshold, "roleType"
FROM "RoleConfig"
ORDER BY "roleType", "roleName"; 