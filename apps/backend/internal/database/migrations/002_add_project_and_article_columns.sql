-- Add missing columns for frontend-backend integration

-- Projects: url, status, stack
ALTER TABLE projects ADD COLUMN IF NOT EXISTS url TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'wip' NOT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS stack TEXT[] DEFAULT '{}';

-- Articles: tags, views, status
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS views BIGINT DEFAULT 0 NOT NULL;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft' NOT NULL;

-- Index on project status for filtering
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Index on article status for filtering
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);

---- create above / drop below ----

DROP INDEX IF EXISTS idx_articles_status;
DROP INDEX IF EXISTS idx_projects_status;

ALTER TABLE articles DROP COLUMN IF EXISTS status;
ALTER TABLE articles DROP COLUMN IF EXISTS views;
ALTER TABLE articles DROP COLUMN IF EXISTS tags;

ALTER TABLE projects DROP COLUMN IF EXISTS stack;
ALTER TABLE projects DROP COLUMN IF EXISTS status;
ALTER TABLE projects DROP COLUMN IF EXISTS url;
