import { apiFetch, toSnakeCase } from './api';

export async function getProjects(page = 1, limit = 20, { createdBy } = {}) {
  let url = `/projects?page=${page}&limit=${limit}`;
  if (createdBy) url += `&createdBy=${encodeURIComponent(createdBy)}`;
  const data = await apiFetch(url);
  return {
    ...data,
    data: data.data.map(mapProject),
  };
}

export async function getProjectById(id) {
  const data = await apiFetch(`/projects/${id}`);
  return mapProject(data);
}

export async function createProject(project) {
  const payload = {
    name: project.name,
    description: project.description || null,
    url: project.url || null,
    status: project.status || 'wip',
    stack: typeof project.stack === 'string'
      ? project.stack.split(',').map((s) => s.trim()).filter(Boolean)
      : project.stack || [],
    isPublic: project.is_public ?? true,
  };
  const data = await apiFetch('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapProject(data);
}

export async function updateProject(id, updates) {
  const payload = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.url !== undefined) payload.url = updates.url;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.stack !== undefined) {
    payload.stack = typeof updates.stack === 'string'
      ? updates.stack.split(',').map((s) => s.trim()).filter(Boolean)
      : updates.stack;
  }
  if (updates.is_public !== undefined) payload.isPublic = updates.is_public;

  const data = await apiFetch(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return mapProject(data);
}

export async function deleteProject(id) {
  return apiFetch(`/projects/${id}`, { method: 'DELETE' });
}

function mapProject(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    url: p.url,
    status: p.status,
    stack: p.stack || [],
    is_public: p.isPublic,
    articles_count: p.articlesCount ?? 0,
    devlogs_count: p.devlogsCount ?? 0,
    created_by: p.createdBy,
    updated_by: p.updatedBy,
    created_at: p.createdAt,
    updated_at: p.updatedAt,
  };
}
