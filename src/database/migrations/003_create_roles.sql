CREATE TABLE roles(
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT
);

INSERT INTO roles(name, description) VALUES
    ('org_owner', 'Can manage organization settings and assign roles'),
    ('org_admin', 'Can manage users, projects, and tasks withing organizations'),
    ('org_member', 'Can manage ony their own accounts and assigned tasks');