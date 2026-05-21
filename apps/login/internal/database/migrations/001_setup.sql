-- PROJECTS table
CREATE TABLE IF NOT EXISTS projects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DEVLOGS table
CREATE TABLE IF NOT EXISTS devlogs (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ARTICLES table
CREATE TABLE IF NOT EXISTS articles (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(255) UNIQUE,
    is_public BOOLEAN DEFAULT false,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- REACTIONS table (likes/dislikes for articles only)
CREATE TABLE IF NOT EXISTS reactions (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    reaction_type VARCHAR(50) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_devlogs_project_id ON devlogs(project_id);
CREATE INDEX IF NOT EXISTS idx_devlogs_created_by ON devlogs(created_by);
CREATE INDEX IF NOT EXISTS idx_devlogs_created_at ON devlogs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_project_id ON articles(project_id);
CREATE INDEX IF NOT EXISTS idx_articles_created_by ON articles(created_by);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reactions_article_id ON reactions(article_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_reactions_created_at ON reactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

---- create above / drop below ----

-- Drop indexes
DROP INDEX IF EXISTS idx_projects_created_by;
DROP INDEX IF EXISTS idx_reactions_created_at;
DROP INDEX IF EXISTS idx_reactions_user_id;
DROP INDEX IF EXISTS idx_reactions_article_id;
DROP INDEX IF EXISTS idx_articles_created_at;
DROP INDEX IF EXISTS idx_articles_created_by;
DROP INDEX IF EXISTS idx_articles_project_id;
DROP INDEX IF EXISTS idx_devlogs_created_at;
DROP INDEX IF EXISTS idx_devlogs_created_by;
DROP INDEX IF EXISTS idx_devlogs_project_id;

-- Drop tables
DROP TABLE IF EXISTS reactions CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS devlogs CASCADE;
DROP TABLE IF EXISTS projects CASCADE;