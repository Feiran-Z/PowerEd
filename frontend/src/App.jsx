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
  const [celeryTaskId, setCeleryTaskId] = useState(null);
  const [workspaceId, setWorkspaceId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  useEffect(() => {
    if (!celeryTaskId) return;
    let statusTimeoutId;
    const pollStatus = async () => {
      try {
        // status
        const res = await fetch(`/api/tasks/${celeryTaskId}/status`);
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          setDownloadReady(true);
          setIsRunning(false);
          return;
        } else if (data.status === 'FAILURE') {
          setIsRunning(false);
          return;
        }
        statusTimeoutId = setTimeout(pollStatus, 2000);
      } catch (err) {
        statusTimeoutId = setTimeout(pollStatus, 2000);
      }
    };
    pollStatus();
    return () => {
      if (statusTimeoutId) clearTimeout(statusTimeoutId);
    };
  }, [celeryTaskId]);

  useEffect(() => {
    if (!workspaceId) return;
    let logTimeoutId;
    let logOffset = 0;
    const pollLogs = async () => {
      try {
        // logs
        const logRes = await fetch(`/api/tasks/${workspaceId}/logs?offset=${logOffset}`);
        const logData = await logRes.json();
        if (logData.logs) {
          setLogs(prev => [...prev, logData.logs]);
          logOffset = logData.next_offset;
        }
        logTimeoutId= setTimeout(pollLogs, 2000);
      } catch (err) {
        logTimeoutId = setTimeout(pollLogs, 2000);
      }
    };
    pollLogs();
    return () => {
      if (logTimeoutId) clearTimeout(logTimeoutId);
    };
  }, [workspaceId]);

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

    setCeleryTaskId(null);
    setWorkspaceId(null);
    setIsRunning(true);
    setDownloadReady(false);
    setLogs([]);
    setUploadStatus('Successfully uploaded');

    try {
      const response = await submitTask(formData);
      const { celery_task_id, workspace_id, ws_url } = response;
      setCeleryTaskId(celery_task_id);
      setWorkspaceId(workspace_id);
    } catch (err) {
      setUploadStatus('error');
      setIsRunning(false);
      alert(`Upload failed: ${err.message}`);
    }
  };

  const statusClass = isRunning ? 'running' : downloadReady ? 'success' : 'idle';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-section">
          <h3 className="sidebar-heading">Files</h3>
          <UploadArea onFilesSelected={setFiles} uploadStatus={uploadStatus} />
        </div>

        <div className="sidebar-section">
          <h3 className="sidebar-heading">Prompt</h3>
          <PromptInput value={prompt} onChange={setPrompt} />
        </div>

        <details className="config-section">
          <summary className="config-summary">Advanced Settings</summary>
          <div className="config-fields">
            <label className="config-label">
              API Key
              <input className="config-input" type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} />
            </label>
            <label className="config-label">
              Base URL
              <input className="config-input" value={baseUrl} onChange={e => setBaseUrl(e.target.value)} />
            </label>
            <label className="config-label">
              Model
              <input className="config-input" value={model} onChange={e => setModel(e.target.value)} />
            </label>
          </div>
        </details>

        <button className="run-btn" onClick={handleRun} disabled={isRunning}>
          {isRunning ? (
            <>
              <span className="run-btn-spinner" />
              Running...
            </>
          ) : (
            'Run Agent'
          )}
        </button>
      </aside>

      <main className="main-panel">
        <header className="main-header">
          <h1>PowerEd Agentic Suite</h1>
          <span className={`status-indicator status-${statusClass}`}>
            <span className="status-dot" />
            {isRunning ? 'Processing' : downloadReady ? 'Complete' : 'Ready'}
          </span>
        </header>

        <LogViewer logs={logs} />

        {downloadReady && (
          <div className="download-section">
            <DownloadButton taskId={workspaceId} />
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
