-- Watson Database Initialization
-- This script runs once when the database container is first created.

-- Create the main development database
-- This is necessary because the POSTGRES_DB env var creates the DB *after* this script runs.
CREATE DATABASE watson_dev;
GRANT ALL PRIVILEGES ON DATABASE watson_dev TO watson;

-- Create the test database
CREATE DATABASE watson_test;
GRANT ALL PRIVILEGES ON DATABASE watson_test TO watson;

-- Create the staging database (if needed)
CREATE DATABASE watson_staging;
GRANT ALL PRIVILEGES ON DATABASE watson_staging TO watson;

-- Now that the databases are created, connect to each one to add extensions.
-- The \gexec command executes the preceding query and uses its output as the input for the next command.
-- This is a robust way to iterate over databases in psql.
\c watson_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c watson_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

\c watson_staging;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";