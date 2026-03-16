-- Fix MySQL Authentication for Prisma/Next.js
-- Run this in phpMyAdmin SQL tab: http://localhost/phpmyadmin

-- Step 1: Check current root users
SELECT user, host, plugin FROM mysql.user WHERE user='root';

-- Step 2: Create root user for 127.0.0.1 if it doesn't exist
CREATE USER IF NOT EXISTS 'root'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '';

-- Step 3: Grant all privileges
GRANT ALL PRIVILEGES ON *.* TO 'root'@'127.0.0.1' WITH GRANT OPTION;

-- Step 4: Update existing root users to use mysql_native_password
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
ALTER USER 'root'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '';
ALTER USER 'root'@'::1' IDENTIFIED WITH mysql_native_password BY '' IF EXISTS;

-- Step 5: Flush privileges
FLUSH PRIVILEGES;

-- Step 6: Verify the changes
SELECT user, host, plugin FROM mysql.user WHERE user='root';

-- You should see mysql_native_password for all root users now
