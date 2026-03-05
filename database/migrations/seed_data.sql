USE `smartlearn`;

-- Seed Categories
INSERT INTO `categories` (`name`, `status`, `created_at`, `updated_at`) VALUES
('Web Development', 1, NOW(), NOW()),
('Mobile Development', 1, NOW(), NOW()),
('Digital Marketing', 1, NOW(), NOW()),
('Graphic Design', 1, NOW(), NOW()),
('Software Design', 1, NOW(), NOW()),
('Content Writing', 1, NOW(), NOW()),
('Finance', 1, NOW(), NOW()),
('Machine Learning', 1, NOW(), NOW());

-- Seed Languages
INSERT INTO `languages` (`name`, `status`, `created_at`, `updated_at`) VALUES
('English', 1, NOW(), NOW()),
('Bengali', 1, NOW(), NOW()),
('Hindi', 1, NOW(), NOW());

-- Seed Levels
INSERT INTO `levels` (`name`, `status`, `created_at`, `updated_at`) VALUES
('Beginner', 1, NOW(), NOW()),
('Intermediate', 1, NOW(), NOW()),
('Advanced', 1, NOW(), NOW());

-- Seed a test user (password: 'password')
INSERT INTO `users` (`name`, `email`, `email_verified_at`, `password`, `created_at`, `updated_at`) VALUES
('Test User', 'test@example.com', NOW(), '$2y$12$sZhgZIcc1mMnlOccFwrue.7vPPkJmGCamo4hMxu.1slfaM6tyeBgG', NOW(), NOW());
