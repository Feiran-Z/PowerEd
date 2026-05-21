import React from 'react';
import { downloadResult } from '../api';

function DownloadButton({ taskId }) {
  return (
    <button
      className="download-btn"
      onClick={() => downloadResult(taskId)}
    >
      Download Results (ZIP)
    </button>
  );
}

export default DownloadButton;
