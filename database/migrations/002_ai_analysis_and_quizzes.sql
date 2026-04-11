USE `smartlearn`;

-- Lesson analyses table (single latest analysis per lesson)
CREATE TABLE IF NOT EXISTS `lesson_analyses` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `lesson_id` BIGINT UNSIGNED NOT NULL,
    `course_id` BIGINT UNSIGNED NOT NULL,
    `status` ENUM('pending','ready','failed') NOT NULL DEFAULT 'pending',
    `model_name` VARCHAR(100) NULL,
    `source_type` ENUM('details-only','details-plus-video') NOT NULL DEFAULT 'details-only',
    `version` INT UNSIGNED NOT NULL DEFAULT 1,
    `summary` MEDIUMTEXT NULL,
    `key_concepts` JSON NULL,
    `raw_payload` LONGTEXT NULL,
    `error_message` TEXT NULL,
    `generated_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    UNIQUE KEY `lesson_analyses_lesson_id_unique` (`lesson_id`),
    INDEX `lesson_analyses_course_id_index` (`course_id`),
    INDEX `lesson_analyses_status_index` (`status`),
    CONSTRAINT `lesson_analyses_lesson_id_foreign` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
    CONSTRAINT `lesson_analyses_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Persisted generated quizzes (keep history per user/lesson)
CREATE TABLE IF NOT EXISTS `user_generated_quizzes` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `course_id` BIGINT UNSIGNED NOT NULL,
    `lesson_id` BIGINT UNSIGNED NOT NULL,
    `lesson_analysis_id` BIGINT UNSIGNED NULL,
    `title` VARCHAR(255) NOT NULL,
    `instructions` TEXT NULL,
    `status` ENUM('ready','archived') NOT NULL DEFAULT 'ready',
    `model_name` VARCHAR(100) NULL,
    `generated_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `user_generated_quizzes_user_id_index` (`user_id`),
    INDEX `user_generated_quizzes_lesson_id_index` (`lesson_id`),
    INDEX `user_generated_quizzes_created_at_index` (`created_at`),
    CONSTRAINT `user_generated_quizzes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `user_generated_quizzes_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `user_generated_quizzes_lesson_id_foreign` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE,
    CONSTRAINT `user_generated_quizzes_lesson_analysis_id_foreign` FOREIGN KEY (`lesson_analysis_id`) REFERENCES `lesson_analyses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_generated_quiz_questions` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `quiz_id` BIGINT UNSIGNED NOT NULL,
    `question_text` TEXT NOT NULL,
    `explanation` TEXT NULL,
    `difficulty` ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
    `sort_order` INT NOT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    UNIQUE KEY `user_generated_quiz_questions_quiz_id_sort_order_unique` (`quiz_id`, `sort_order`),
    CONSTRAINT `user_generated_quiz_questions_quiz_id_foreign` FOREIGN KEY (`quiz_id`) REFERENCES `user_generated_quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_generated_quiz_options` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `question_id` BIGINT UNSIGNED NOT NULL,
    `option_text` TEXT NOT NULL,
    `is_correct` ENUM('yes','no') NOT NULL DEFAULT 'no',
    `sort_order` INT NOT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    UNIQUE KEY `user_generated_quiz_options_question_id_sort_order_unique` (`question_id`, `sort_order`),
    CONSTRAINT `user_generated_quiz_options_question_id_foreign` FOREIGN KEY (`question_id`) REFERENCES `user_generated_quiz_questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Attempts and answers (preserve historical user results)
CREATE TABLE IF NOT EXISTS `user_quiz_attempts` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `quiz_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `course_id` BIGINT UNSIGNED NOT NULL,
    `lesson_id` BIGINT UNSIGNED NOT NULL,
    `score_percent` DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    `total_questions` INT UNSIGNED NOT NULL DEFAULT 0,
    `correct_answers` INT UNSIGNED NOT NULL DEFAULT 0,
    `started_at` TIMESTAMP NULL,
    `submitted_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    INDEX `user_quiz_attempts_user_id_index` (`user_id`),
    INDEX `user_quiz_attempts_quiz_id_index` (`quiz_id`),
    INDEX `user_quiz_attempts_lesson_id_index` (`lesson_id`),
    CONSTRAINT `user_quiz_attempts_quiz_id_foreign` FOREIGN KEY (`quiz_id`) REFERENCES `user_generated_quizzes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `user_quiz_attempts_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
    CONSTRAINT `user_quiz_attempts_course_id_foreign` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `user_quiz_attempts_lesson_id_foreign` FOREIGN KEY (`lesson_id`) REFERENCES `lessons` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_quiz_attempt_answers` (
    `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `attempt_id` BIGINT UNSIGNED NOT NULL,
    `quiz_question_id` BIGINT UNSIGNED NOT NULL,
    `selected_option_id` BIGINT UNSIGNED NULL,
    `is_correct` ENUM('yes','no') NOT NULL DEFAULT 'no',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    UNIQUE KEY `user_quiz_attempt_answers_attempt_id_quiz_question_id_unique` (`attempt_id`, `quiz_question_id`),
    CONSTRAINT `user_quiz_attempt_answers_attempt_id_foreign` FOREIGN KEY (`attempt_id`) REFERENCES `user_quiz_attempts` (`id`) ON DELETE CASCADE,
    CONSTRAINT `user_quiz_attempt_answers_quiz_question_id_foreign` FOREIGN KEY (`quiz_question_id`) REFERENCES `user_generated_quiz_questions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `user_quiz_attempt_answers_selected_option_id_foreign` FOREIGN KEY (`selected_option_id`) REFERENCES `user_generated_quiz_options` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
