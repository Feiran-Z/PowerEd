// frontend/src/api.js
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const submitTask = async (formData) => {
  const response = await fetch(`${API_BASE}/tasks`, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type header; browser will set it with boundary
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json();
};

export const downloadResult = (taskId) => {
  window.open(`${API_BASE}/tasks/${taskId}/download`, '_blank');
};