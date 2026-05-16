import React, { useState } from 'react';
import UploadArea from './components/UploadArea';
import PromptInput from './components/PromptInput';
import LogViewer from './components/LogViewer';
import DownloadButton from './components/DownloadButton';
import { submitTask } from './api';

function App() {
  const [files, setFiles] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://api.deepseek.com/anthropic');
  const [model, setModel] = useState('deepseek-v4-flash');
  const [taskId, setTaskId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setDownloadReady(false);
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('api_key', apiKey);
    if (baseUrl) formData.append('base_url', baseUrl);
    if (model) formData.append('model', model);
    files.forEach(f => formData.append('files', f));

    const response = await submitTask(formData);
    const { task_id, ws_url } = response;
    setTaskId(task_id);
    
    // WebSocket connection for logs
    const ws = new WebSocket(`ws://${window.location.host}${ws_url}`);
    ws.onmessage = (event) => {
      setLogs(prev => [...prev, event.data]);
      if (event.data.includes('Results zipped')) {
        setDownloadReady(true);
        setIsRunning(false);
      }
    };
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>CoTEACH Web Agent</h1>
      <UploadArea onFilesSelected={setFiles} />
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