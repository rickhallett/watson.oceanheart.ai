-- Watson Database Initialization
-- Creates additional databases for testing and staging

-- Create test database
CREATE DATABASE watson_test;
GRANT ALL PRIVILEGES ON DATABASE watson_test TO watson;

-- Create staging database (if needed)
CREATE DATABASE watson_staging;
GRANT ALL PRIVILEGES ON DATABASE watson_staging TO watson;

-- Set up extensions that might be needed
\c watson_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c watson_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c watson_staging;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";