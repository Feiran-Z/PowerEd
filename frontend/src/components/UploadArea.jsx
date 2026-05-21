import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

function UploadArea({ onFilesSelected, uploadStatus = 'idle' }) {
  const [files, setFiles] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
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

  useEffect(() => {
    onFilesSelected(files);
  }, [files, onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

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
    <div className="upload-area">
      <div
        {...getRootProps()}
        className={`upload-dropzone${isDragActive ? ' upload-dropzone--active' : ''}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop files here...</p>
        ) : (
          <p>Drag & drop files here, or click to select (PDF, DOCX, XLSX, PPTX, TXT, etc.)</p>
        )}
      </div>

      {files.length > 0 && (
        <div className="upload-file-list">
          {files.map((file, idx) => (
            <div key={`${file.name}-${idx}`} className="upload-file-item">
              <span className="upload-file-name">
                📄 {file.name}
                <span className="upload-file-size">({formatBytes(file.size)})</span>
              </span>
              <button
                onClick={() => removeFile(idx)}
                className="upload-file-remove"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {getStatusIcon() && (
        <div className="upload-status">
          {getStatusIcon()}
        </div>
      )}
    </div>
  );
}

export default UploadArea;
