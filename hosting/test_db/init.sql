CREATE USER prisma_user WITH PASSWORD 'password';
CREATE DATABASE prod_db OWNER prisma_user;
CREATE DATABASE prod_db_shadow OWNER prisma_user;