-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS habit_tracker;
USE habit_tracker;

-- Create User table
CREATE TABLE IF NOT EXISTS `User` (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  email VARCHAR(191) NOT NULL UNIQUE,
  password VARCHAR(191) NOT NULL,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  INDEX `User_email_idx`(email)
) ENGINE InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Habit table
CREATE TABLE IF NOT EXISTS `Habit` (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  userId VARCHAR(191) NOT NULL,
  title VARCHAR(191) NOT NULL,
  targetTomato INT NOT NULL,
  description VARCHAR(191),
  isActive BOOLEAN NOT NULL DEFAULT true,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `User`(id) ON DELETE CASCADE,
  INDEX `Habit_userId_idx`(userId),
  INDEX `Habit_isActive_idx`(isActive)
) ENGINE InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create Session table
CREATE TABLE IF NOT EXISTS `Session` (
  id VARCHAR(191) NOT NULL PRIMARY KEY,
  userId VARCHAR(191) NOT NULL,
  habitId VARCHAR(191) NOT NULL,
  status VARCHAR(191) NOT NULL DEFAULT 'IDLE',
  startTime DATETIME(3),
  endTime DATETIME(3),
  duration INT NOT NULL DEFAULT 1500,
  createdAt DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updatedAt DATETIME(3) NOT NULL,
  FOREIGN KEY (`userId`) REFERENCES `User`(id) ON DELETE CASCADE,
  FOREIGN KEY (`habitId`) REFERENCES `Habit`(id) ON DELETE CASCADE,
  INDEX `Session_userId_idx`(userId),
  INDEX `Session_habitId_idx`(habitId),
  INDEX `Session_status_idx`(status),
  INDEX `Session_createdAt_idx`(createdAt)
) ENGINE InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
