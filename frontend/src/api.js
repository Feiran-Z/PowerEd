import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const submitTask = async (formData) => {
  const res = await axios.post(`${API_BASE}/tasks`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const downloadResult = (taskId) => {
  window.open(`${API_BASE}/tasks/${taskId}/download`, '_blank');
};