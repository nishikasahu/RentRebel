import { useRef, useState } from 'react';

function FileUpload({ selectedFile, onFileSelect }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const acceptFile = (file) => {
    if (!file) {
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div
      className={`upload-card ${isDragging ? 'dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div>
        <p className="field-label">File Upload</p>
        <p className="helper-copy">Upload PDF or image files for document review.</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="file-input"
        onChange={(event) => acceptFile(event.target.files?.[0])}
      />

      <button className="ghost-button" type="button" onClick={() => inputRef.current?.click()}>
        Choose file
      </button>

      <div className="file-status">
        {selectedFile ? (
          <span className="file-name">{selectedFile.name}</span>
        ) : (
          <span>Drop a file here or browse</span>
        )}
      </div>
    </div>
  );
}

export default FileUpload;