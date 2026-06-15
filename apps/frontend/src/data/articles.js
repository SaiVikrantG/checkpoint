import { apiFetch } from './api';

export async function getArticles(page = 1, limit = 20, { createdBy } = {}) {
  let url = `/articles?page=${page}&limit=${limit}`;
  if (createdBy) url += `&createdBy=${encodeURIComponent(createdBy)}`;
  const data = await apiFetch(url);
  return {
    ...data,
    data: data.data.map(mapArticle),
  };
}

export async function getArticleById(id) {
  const data = await apiFetch(`/articles/${id}`);
  return mapArticle(data);
}

export async function createArticle(article) {
  const payload = {
    title: article.title,
    content: article.content || '',
    slug: article.slug || null,
    tags: article.tags || [],
    status: article.status || 'draft',
    isPublic: article.is_public ?? false,
    projectId: article.project_id || null,
  };
  const data = await apiFetch('/articles', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapArticle(data);
}

export async function updateArticle(id, updates) {
  const payload = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.content !== undefined) payload.content = updates.content;
  if (updates.slug !== undefined) payload.slug = updates.slug;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.is_public !== undefined) payload.isPublic = updates.is_public;
  if (updates.project_id !== undefined) payload.projectId = updates.project_id;

  const data = await apiFetch(`/articles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return mapArticle(data);
}

export async function deleteArticle(id) {
  return apiFetch(`/articles/${id}`, { method: 'DELETE' });
}

export async function deleteArticles(ids) {
  await Promise.all(ids.map((id) => deleteArticle(id)));
}

function mapArticle(a) {
  return {
    id: a.id,
    title: a.title,
    content: a.content,
    slug: a.slug,
    tags: a.tags || [],
    views: a.views ?? 0,
    status: a.status || 'draft',
    project_id: a.projectId,
    project_name: a.projectName || null,
    is_public: a.isPublic,
    created_by: a.createdBy,
    updated_by: a.updatedBy,
    created_at: a.createdAt,
    updated_at: a.updatedAt,
  };
}
