-- PostgreSQL Schema
CREATE DATABASE choreion;

\c choreion;

-- People Table
CREATE TABLE people (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20),
    start_x INTEGER,
    start_y INTEGER
);

-- Choreographies Table
CREATE TABLE choreographies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    routes_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data for People (20 people with default positions)
INSERT INTO people (name, color, start_x, start_y) VALUES
('Person 1', '#e53935', 50, 50),
('Person 2', '#d81b60', 200, 50),
('Person 3', '#8e24aa', 350, 50),
('Person 4', '#5e35b1', 500, 50),
('Person 5', '#3949ab', 650, 50),
('Person 6', '#1e88e5', 50, 200),
('Person 7', '#039be5', 200, 200),
('Person 8', '#00acc1', 350, 200),
('Person 9', '#00897b', 500, 200),
('Person 10', '#43a047', 650, 200),
('Person 11', '#7cb342', 50, 350),
('Person 12', '#c0ca33', 200, 350),
('Person 13', '#fdd835', 350, 350),
('Person 14', '#ffb300', 500, 350),
('Person 15', '#fb8c00', 650, 350),
('Person 16', '#f4511e', 50, 500),
('Person 17', '#6d4c41', 200, 500),
('Person 18', '#757575', 350, 500),
('Person 19', '#546e7a', 500, 500),
('Person 20', '#ec407a', 650, 500);
