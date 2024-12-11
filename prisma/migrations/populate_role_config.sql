-- Populate holder roles
INSERT INTO "RoleConfig" ("roleName", "roleId", "displayName", "collectionName", "roleType")
SELECT * FROM (VALUES
    ('ai_bitbots_holder', '1095034117877399686', 'AI BitBots Holder', 'ai_bitbots', 'holder'),
    ('fcked_catz_holder', '1095033759612547133', 'FCKED CATZ Holder', 'fcked_catz', 'holder'),
    ('money_monsters_holder', '1093607056696692828', 'Money Monsters Holder', 'money_monsters', 'holder'),
    ('money_monsters3d_holder', '1093607187454111825', 'Money Monsters 3D Holder', 'money_monsters3d', 'holder'),
    ('celebcatz_holder', '1095335098112561234', 'CelebCatz Holder', 'celebcatz', 'holder'),
    ('candy_bots_holder', '1300969268665389157', 'Candy Bots Holder', 'candy_bots', 'holder'),
    ('doodle_bots_holder', '1300969353952362557', 'Doodle Bots Holder', 'doodle_bot', 'holder'),
    ('energy_apes_holder', '1300968964276621313', 'Energy Apes Holder', 'energy_apes', 'holder'),
    ('rjctd_bots_holder', '1300969147441610773', 'RJCTD Bots Holder', 'rjctd_bots', 'holder'),
    ('squirrels_holder', '1300968613179686943', 'Squirrels Holder', 'squirrels', 'holder'),
    ('warriors_holder', '1300968343783735296', 'Warriors Holder', 'warriors', 'holder')
) AS v(roleName, roleId, displayName, collectionName, roleType)
WHERE NOT EXISTS (
    SELECT 1 FROM "RoleConfig" WHERE "roleName" = v.roleName
);

-- Populate whale roles with thresholds
INSERT INTO "RoleConfig" ("roleName", "roleId", "collectionName", "roleType", "threshold")
SELECT * FROM (VALUES
    ('ai_bitbots_whale', '1095033899492573274', 'ai_bitbots', 'whale', 10),
    ('fcked_catz_whale', '1095033566070583457', 'fcked_catz', 'whale', 25),
    ('money_monsters_whale', '1093606438674382858', 'money_monsters', 'whale', 25),
    ('money_monsters3d_whale', '1093606579355525252', 'money_monsters3d', 'whale', 25)
) AS v(roleName, roleId, collectionName, roleType, threshold)
WHERE NOT EXISTS (
    SELECT 1 FROM "RoleConfig" WHERE "roleName" = v.roleName
);

-- Populate BUX roles with thresholds
INSERT INTO "RoleConfig" ("roleName", "roleId", "roleType", "threshold")
SELECT * FROM (VALUES
    ('bux_banker', '1095363984581984357', 'bux', 50000),
    ('bux_beginner', '1248416679504117861', 'bux', 2500),
    ('bux_saver', '1248417591215784019', 'bux', 25000),
    ('bux_builder', '1248417674476916809', 'bux', 10000)
) AS v(roleName, roleId, roleType, threshold)
WHERE NOT EXISTS (
    SELECT 1 FROM "RoleConfig" WHERE "roleName" = v.roleName
);

-- Populate special roles
INSERT INTO "RoleConfig" ("roleName", "roleId", "collectionName", "roleType")
SELECT * FROM (VALUES
    ('mm_top10', '1095338675224707103', 'money_monsters', 'top10'),
    ('mm3d_top10', '1095338840178294795', 'money_monsters3d', 'top10'),
    ('buxdao_5', '1248428373487784006', NULL, 'special')
) AS v(roleName, roleId, collectionName, roleType)
WHERE NOT EXISTS (
    SELECT 1 FROM "RoleConfig" WHERE "roleName" = v.roleName
); 