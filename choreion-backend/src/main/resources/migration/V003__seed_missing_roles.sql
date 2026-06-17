-- Defensive re-seed: environments where this DB's schema predates Flyway
-- tracking (baseline-on-migrate) never actually ran V001's role INSERTs,
-- leaving the roles table empty/partial and user creation failing with
-- "Role not found: ROLE_USER".
INSERT INTO roles (name) VALUES
('ROLE_USER'),
('ROLE_CHOREOGRAPHER'),
('ROLE_ADMIN')
ON CONFLICT (name) DO NOTHING;
