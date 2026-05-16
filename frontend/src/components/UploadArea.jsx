import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

function UploadArea({ onFilesSelected }) {
  const onDrop = useCallback((acceptedFiles) => {
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
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
        <p>Drag & drop files here, or click to select (PDF, DOCX, XLSX, PPTX, etc.)</p>
      )}
    </div>
  );
}

export default UploadArea;