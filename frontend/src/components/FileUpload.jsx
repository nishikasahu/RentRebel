import { useEffect, useRef, useState } from 'react';

function FileUpload({ selectedFile, onFileSelect, isAnalyzing }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('');
      return undefined;
    }

    const isImage = selectedFile.type.startsWith('image/');
    if (!isImage) {
      setPreviewUrl('');
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const acceptFile = (file) => {
    if (!file) {
      return;
    }

    const isAllowedType = ['application/pdf', 'image/png', 'image/jpeg'].includes(file.type);
    if (!isAllowedType) {
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
        accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
        className="file-input"
        disabled={isAnalyzing}
        onChange={(event) => acceptFile(event.target.files?.[0])}
      />

      <button className="ghost-button" type="button" onClick={() => inputRef.current?.click()} disabled={isAnalyzing}>
        Choose file
      </button>

      <div className="file-status">
        {selectedFile ? (
          <span className="file-name">{selectedFile.name}</span>
        ) : (
          <span>Drop a file here or browse</span>
        )}
      </div>

      {previewUrl ? <img className="file-preview" src={previewUrl} alt="Uploaded document preview" /> : null}
    </div>
  );
}

export default FileUpload;