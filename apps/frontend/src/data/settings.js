import { apiFetch } from './api';

export async function getThemeSettings() {
  const data = await apiFetch('/settings/theme');
  return mapTheme(data);
}

export async function updateThemeSettings(theme) {
  const payload = {
    name: theme.name,
    bg: theme.bg,
    fg: theme.fg,
    ac: theme.ac,
  };
  const data = await apiFetch('/settings/theme', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return mapTheme(data);
}

function mapTheme(t) {
  return {
    name: t.name,
    bg: t.bg,
    fg: t.fg,
    ac: t.ac,
    updated_by: t.updatedBy,
    updated_at: t.updatedAt,
  };
}
