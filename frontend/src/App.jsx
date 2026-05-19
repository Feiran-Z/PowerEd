import React, { useState } from 'react';
import UploadArea from './components/UploadArea';
import PromptInput from './components/PromptInput';
import LogViewer from './components/LogViewer';
import DownloadButton from './components/DownloadButton';
import { submitTask } from './api';

function App() {
  const [files, setFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState('idle');
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com/anthropic');
  const [model, setModel] = useState('deepseek-v4-flash');
  const [taskId, setTaskId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

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

    setIsRunning(true);
    setDownloadReady(false);
    setLogs([]);
    setUploadStatus('uploading');

    try {
      const response = await submitTask(formData);
      const { task_id, ws_url } = response;
      setTaskId(task_id);
  
      // 1) Try WebSocket for live logs (optional)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}${ws_url}`);
      ws.onmessage = (event) => {
        setLogs(prev => [...prev, event.data]);
        if (event.data.includes('Results zipped')) {
          setDownloadReady(true);
          setIsRunning(false);
        }
      };
      ws.onerror = (err) => console.error("WebSocket error", err);
  
      // 2) Poll for completion as fallback (every 2 seconds)
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/tasks/${task_id}/status`);
          const statusData = await statusRes.json();
          if (statusData.status === 'SUCCESS') {
            clearInterval(pollInterval);
            setDownloadReady(true);
            setIsRunning(false);
            // Optionally fetch logs from a new endpoint if needed
          } else if (statusData.status === 'FAILURE') {
            clearInterval(pollInterval);
            setIsRunning(false);
            setLogs(prev => [...prev, "❌ Task failed"]);
          }
        } catch (err) {
          console.error("Poll error", err);
        }
      }, 2000);
    } catch (err) {
      setUploadStatus('error');
      setIsRunning(false);
      alert(`Upload failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>PowerEd Agent</h1>
      <UploadArea onFilesSelected={setFiles} uploadStatus={uploadStatus} />
      <PromptInput value={prompt} onChange={setPrompt} />
      <div>
        <label>API Key: <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} /></label>
        <label>Base URL: <input value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} /></label>
        <label>Model: <input value={model} onChange={e=>setModel(e.target.value)} /></label>
      </div>
      <button onClick={handleRun} disabled={isRunning}>Run Agent</button>
      <LogViewer logs={logs} />
      {downloadReady && <DownloadButton taskId={taskId} />}
    </div>
  );
}
export default App;