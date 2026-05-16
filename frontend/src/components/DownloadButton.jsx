import React from 'react';
import { downloadResult } from '../api';

function DownloadButton({ taskId }) {
  return (
    <button
      onClick={() => downloadResult(taskId)}
      style={{
        marginTop: 10,
        padding: '8px 16px',
        backgroundColor: '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: 4,
        cursor: 'pointer',
      }}
    >
      Download Results (ZIP)
    </button>
  );
}

export default DownloadButton;