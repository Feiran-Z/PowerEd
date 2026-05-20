import React, { useState, useEffect } from 'react';
import UploadArea from './components/UploadArea';
import PromptInput from './components/PromptInput';
import LogViewer from './components/LogViewer';
import DownloadButton from './components/DownloadButton';
import { submitTask } from './api';
import './App.css';

function App() {
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com/anthropic');
  const [model, setModel] = useState('deepseek-v4-flash');
  const [taskId, setTaskId] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  useEffect(() => {
    if (!taskId) return;
    let timeoutId;
    const poll = async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/status`);
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          setDownloadReady(true);
          setIsRunning(false);
          return;
        } else if (data.status === 'FAILURE') {
          setIsRunning(false);
          return;
        }
        timeoutId = setTimeout(poll, 2000);
      } catch (err) {
        timeoutId = setTimeout(poll, 2000);
      }
    };
    poll();
    return () => clearTimeout(timeoutId);
  }, [taskId]); // re-run when taskId changes

  const handleRun = async () => {
    // --- Validation first ---
    if (files.length === 0) {
      alert("Please select at least one file.");
      return;
    }
    if (!prompt.trim()) {
      alert("Please enter a prompt.");
      return;
    }
    if (!apiKey.trim()) {
      alert("Please enter your API key.");
      return;
    }

    // --- Build FormData (ONCE) ---
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('api_key', apiKey);
    if (baseUrl) formData.append('base_url', baseUrl);
    if (model) formData.append('model', model);
    files.forEach(f => formData.append('files', f));
    
    setTaskId(null);
    setIsRunning(true);
    setDownloadReady(false);
    setLogs([]);
    setUploadStatus('uploading');

    try {
      const response = await submitTask(formData);
      const { celery_task_id, workspace_id, ws_url } = response;
      setTaskId(celery_task_id);       // for status polling
      setWorkspaceId(workspace_id);    // for download
  
      // 1) Try WebSocket for live logs (optional)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}${ws_url}`);
      ws.onopen = () => console.log("WebSocket connected");
      ws.onmessage = (event) => setLogs(prev => [...prev, event.data]);
      ws.onerror = (err) => console.error("WebSocket error", err);
      ws.onclose = () => console.log("WebSocket closed");
      
    } catch (err) {
      setUploadStatus('error');
      setIsRunning(false);
      alert(`Upload failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>PowerEd Agentic Suite</h1>
      <UploadArea onFilesSelected={setFiles} uploadStatus={uploadStatus} />
      <PromptInput value={prompt} onChange={setPrompt} />
      <div>
        <label>API Key: <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} /></label>
        <label>Base URL: <input value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} /></label>
        <label>Model: <input value={model} onChange={e=>setModel(e.target.value)} /></label>
      </div>
      <button onClick={handleRun} disabled={isRunning}>Run Agent</button>
      <LogViewer logs={logs} />
      {downloadReady && <DownloadButton taskId={workspaceId} />}
    </div>
  );
}
export default App;