import { apiFetch } from './api';

export async function getDevlogs(page = 1, limit = 20, { createdBy } = {}) {
  let url = `/devlogs?page=${page}&limit=${limit}`;
  if (createdBy) url += `&createdBy=${encodeURIComponent(createdBy)}`;
  const data = await apiFetch(url);
  return {
    ...data,
    data: data.data.map(mapDevlog),
  };
}

export async function getDevlogById(id) {
  const data = await apiFetch(`/devlogs/${id}`);
  return mapDevlog(data);
}

export async function getDevlogsByProject(projectId, page = 1, limit = 50) {
  const data = await apiFetch(`/devlogs/project/${projectId}?page=${page}&limit=${limit}`);
  return {
    ...data,
    data: data.data.map(mapDevlog),
  };
}

export async function getDevlogsGroupedByProject({ createdBy } = {}) {
  let url = '/devlogs?page=1&limit=100';
  if (createdBy) url += `&createdBy=${encodeURIComponent(createdBy)}`;
  const data = await apiFetch(url);
  const devlogs = data.data.map(mapDevlog);

  const groups = {};
  for (const d of devlogs) {
    const key = d.project_id;
    if (!groups[key]) {
      groups[key] = { project_id: d.project_id, project_name: d.project_name, entries: [] };
    }
    groups[key].entries.push(d);
  }
  return Object.values(groups);
}

export async function createDevlog(devlog) {
  const payload = {
    title: devlog.title,
    content: devlog.content || '',
    isPublic: devlog.is_public ?? true,
    projectId: devlog.project_id,
  };
  const data = await apiFetch('/devlogs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return mapDevlog(data);
}

export async function updateDevlog(id, updates) {
  const payload = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.content !== undefined) payload.content = updates.content;
  if (updates.is_public !== undefined) payload.isPublic = updates.is_public;

  const data = await apiFetch(`/devlogs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return mapDevlog(data);
}

export async function deleteDevlog(id) {
  return apiFetch(`/devlogs/${id}`, { method: 'DELETE' });
}

function mapDevlog(d) {
  return {
    id: d.id,
    project_id: d.projectId,
    project_name: d.projectName || null,
    title: d.title,
    content: d.content,
    is_public: d.isPublic,
    created_by: d.createdBy,
    updated_by: d.updatedBy,
    created_at: d.createdAt,
    updated_at: d.updatedAt,
  };
}
