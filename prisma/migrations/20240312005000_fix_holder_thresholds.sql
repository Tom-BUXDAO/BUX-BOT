-- Update holder role thresholds from 0 to 1
UPDATE "RoleConfig"
SET 
    threshold = 1,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "roleType" = 'nft'
AND "roleName" LIKE '%_holder';

-- Verify the changes
SELECT 
    "roleName",
    threshold,
    "roleType"
FROM "RoleConfig"
WHERE "roleType" = 'nft'
ORDER BY "roleName"; 