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
    <div className={`upload-card`}> 
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

      <div
        className={`file-drop-zone ${isDragging ? 'drag-over' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
      >
        {!selectedFile ? (
          <div className="drop-inner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="drop-text">
              <div className="drop-title">Drop agreement here</div>
              <div className="drop-sub">PDF · Image · Scanned doc</div>
            </div>
          </div>
        ) : (
          <div className="drop-inner ready">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M20 6L9 17l-5-5" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="drop-text">
              <div className="drop-title file-ready">{selectedFile.name.length > 24 ? `${selectedFile.name.slice(0,24)}...` : selectedFile.name}</div>
              <div className="drop-sub ready-text">Ready to analyze</div>
            </div>
          </div>
        )}
      </div>

      {previewUrl ? <img className="file-preview" src={previewUrl} alt="Uploaded document preview" /> : null}
    </div>
  );
}

export default FileUpload;