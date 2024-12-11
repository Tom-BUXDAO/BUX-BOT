-- First, clear existing role configs if any
TRUNCATE TABLE "RoleConfig";

-- Insert holder roles
INSERT INTO "RoleConfig" (roleName, roleId, collectionName, roleType) VALUES
('ai_bitbots_holder', '1095034117877399686', 'ai_bitbots', 'holder'),
('fcked_catz_holder', '1095033759612547133', 'fcked_catz', 'holder'),
('money_monsters_holder', '1093607056696692828', 'money_monsters', 'holder'),
('money_monsters3d_holder', '1093607187454111825', 'money_monsters3d', 'holder'),
('celebcatz_holder', '1095335098112561234', 'celebcatz', 'holder'),
('candy_bots_holder', '1300969268665389157', 'candy_bots', 'holder'),
('doodle_bots_holder', '1300969353952362557', 'doodle_bot', 'holder'),
('energy_apes_holder', '1300968964276621313', 'energy_apes', 'holder'),
('rjctd_bots_holder', '1300969147441610773', 'rjctd_bots', 'holder'),
('squirrels_holder', '1300968613179686943', 'squirrels', 'holder'),
('warriors_holder', '1300968343783735296', 'warriors', 'holder');

-- Insert whale roles with thresholds
INSERT INTO "RoleConfig" (roleName, roleId, collectionName, roleType, threshold) VALUES
('ai_bitbots_whale', '1095033899492573274', 'ai_bitbots', 'whale', 10),
('fcked_catz_whale', '1095033566070583457', 'fcked_catz', 'whale', 25),
('money_monsters_whale', '1093606438674382858', 'money_monsters', 'whale', 25),
('money_monsters3d_whale', '1093606579355525252', 'money_monsters3d', 'whale', 25);

-- Insert BUX token roles with thresholds
INSERT INTO "RoleConfig" (roleName, roleId, roleType, threshold) VALUES
('bux_banker', '1095363984581984357', 'bux', 50000),
('bux_beginner', '1248416679504117861', 'bux', 2500),
('bux_saver', '1248417591215784019', 'bux', 25000),
('bux_builder', '1248417674476916809', 'bux', 10000);

-- Insert special roles
INSERT INTO "RoleConfig" (roleName, roleId, collectionName, roleType) VALUES
('mm_top10', '1095338675224707103', 'money_monsters', 'top10'),
('mm3d_top10', '1095338840178294795', 'money_monsters3d', 'top10'),
('buxdao_5', '1248428373487784006', NULL, 'special');

-- Create function to get role ID by name
CREATE OR REPLACE FUNCTION get_role_id(role_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT roleId FROM "RoleConfig" WHERE roleName = role_name);
END;
$$ LANGUAGE plpgsql;

-- Create function to get threshold by role name
CREATE OR REPLACE FUNCTION get_threshold(role_name TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT threshold FROM "RoleConfig" WHERE roleName = role_name);
END;
$$ LANGUAGE plpgsql; 