-- Create admin user
-- Password: trekkete (BCrypt hashed)

-- Ensure ROLE_ADMIN exists
INSERT INTO roles (name)
VALUES ('ROLE_ADMIN')
ON CONFLICT (name) DO NOTHING;

-- Insert admin user
INSERT INTO users (username, password, email, full_name, created_at)
VALUES (
    'admin',
    '$2y$05$v/6XC/DzOI3Fr1qAeshffO43.O1OpfNyu4W.3g3W6j.Cu6qHWJr4q',
    'admin@example.com',
    'Admin',
    CURRENT_TIMESTAMP
)
ON CONFLICT (username) DO NOTHING;

-- Link user to ROLE_ADMIN role
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin'
AND r.name = 'ROLE_ADMIN'
ON CONFLICT DO NOTHING;
