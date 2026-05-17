import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

function UploadArea({ onFilesSelected, uploadStatus = 'idle' }) {
  const [files, setFiles] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    // Append new files to existing ones (or replace – your choice)
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const removeFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Notify parent whenever files change
  useEffect(() => {
    onFilesSelected(files);
  }, [files, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Status message mapping
  const getStatusIcon = () => {
    switch (uploadStatus) {
      case 'uploading':
        return '⏳ Uploading...';
      case 'success':
        return '✅ Files uploaded successfully!';
      case 'error':
        return '❌ Upload failed. Please try again.';
      default:
        return null;
    }
  };

  return (
    <div>
      <div
        {...getRootProps()}
        style={{
          border: '2px dashed #ccc',
          borderRadius: 8,
          padding: 20,
          textAlign: 'center',
          cursor: 'pointer',
          marginBottom: 20,
          backgroundColor: isDragActive ? '#f0f0f0' : 'white',
        }}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop files here...</p>
        ) : (
          <p>Drag & drop files here, or click to select (PDF, DOCX, XLSX, PPTX, TXT, etc.)</p>
        )}
      </div>

      {/* File list display */}
      {files.length > 0 && (
        <div style={{ marginBottom: 20, padding: 10, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Selected Files ({files.length})</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {files.map((file, idx) => (
              <li key={`${file.name}-${idx}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span>
                  📄 {file.name} <span style={{ fontSize: 12, color: '#666' }}>({formatBytes(file.size)})</span>
                </span>
                <button
                  onClick={() => removeFile(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#dc3545',
                    fontSize: 18,
                  }}
                >
                  ✖
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload status indication */}
      {getStatusIcon() && (
        <div style={{ marginTop: 10, fontSize: 14, fontWeight: 'bold' }}>
          {getStatusIcon()}
        </div>
      )}
    </div>
  );
}

export default UploadArea;