-- Populate holder roles
INSERT INTO "RoleConfig" ("roleName", "roleId", "displayName", "collectionName", "roleType")
SELECT * FROM (VALUES
    ('ai_bitbots_holder', '1095034117877399686', 'AI BitBots Holder', 'ai_bitbots', 'holder'),
    ('fcked_catz_holder', '1095033759612547133', 'FCKED CATZ Holder', 'fcked_catz', 'holder')
) AS v(roleName, roleId, displayName, collectionName, roleType)
WHERE NOT EXISTS (
    SELECT 1 FROM "RoleConfig" WHERE "roleName" = v.roleName
); 