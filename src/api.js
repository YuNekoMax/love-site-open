export async function request(path, options = {}) {
  const init = { method: options.method || 'GET' };
  if (options.body !== undefined) {
    init.headers = { 'content-type': 'application/json' };
    init.body = JSON.stringify(options.body);
  }
  const res = await fetch('/api' + path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '请求失败了');
  return data;
}

export const getMe = () => request('/me');
export const getAuthConfig = () => request('/auth/config');
export const getChallenge = () => request('/auth/challenge');
export const login = (payload) => request('/auth/login', { method: 'POST', body: payload });
export const logout = () => request('/auth/logout', { method: 'POST', body: {} });
export const getHome = () => request('/home');
export const getEntries = () => request('/entries');
export const getPhotos = () => request('/photos');
export const getDates = () => request('/dates');
export const getStatus = () => request('/status');
export const getWishes = () => request('/wishes');
export const createWish = (text) => request('/wishes', { method: 'POST', body: { text } });

export const postCheckin = (mood) => request('/checkin', { method: 'POST', body: { mood } });
export const postAnswer = (answer) => request('/answer', { method: 'POST', body: { answer } });
export const patchWish = (id, done) => request(`/wishes/${id}`, { method: 'PATCH', body: { done } });
export const createShare = () => request('/share', { method: 'POST', body: {} });
export const getCapsules = () => request('/capsules');
export const createCapsule = (item) => request('/capsules', { method: 'POST', body: item });
export const deleteCapsule = (id) => request(`/capsules/${id}`, { method: 'DELETE' });
export const getHealth = () => request('/health');

export const createEntry = (entry) => request('/entries', { method: 'POST', body: entry });
export const updateEntry = (id, entry) => request(`/entries/${id}`, { method: 'PUT', body: entry });
export const deleteEntry = (id) => request(`/entries/${id}`, { method: 'DELETE' });
export const deletePhoto = (id) => request(`/photos/${id}`, { method: 'DELETE' });
export const createMilestone = (item) => request('/milestones', { method: 'POST', body: item });
export const patchMilestone = (id, item) => request(`/milestones/${id}`, { method: 'PATCH', body: item });
export const deleteMilestone = (id) => request(`/milestones/${id}`, { method: 'DELETE' });
export const deleteWish = (id) => request(`/wishes/${id}`, { method: 'DELETE' });
export const updateSettings = (settings) => request('/settings', { method: 'PUT', body: settings });

export async function uploadForm(path, formData) {
  const res = await fetch('/api' + path, { method: 'POST', body: formData });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '上传失败了');
  return data;
}

export const uploadPhoto = (formData) => uploadForm('/photos', formData);
export const uploadAvatar = (formData) => uploadForm('/avatar', formData);
