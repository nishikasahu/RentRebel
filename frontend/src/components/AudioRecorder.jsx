import { useEffect, useRef, useState } from 'react';

function AudioRecorder({ audioBlob, setAudioBlob, audioTranscript, setAudioTranscript, isAnalyzing }) {
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Stopped');
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stop?.();
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
    };
  }, []);

  const stopStream = () => {
    streamRef.current?.getTracks?.().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setStatus('Recording is unavailable in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setStatus('Audio ready');
        stopStream();
      };

      recorder.start();
      setIsRecording(true);
      setStatus('Recording...');
    } catch {
      setStatus('Microphone access denied');
      stopStream();
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="upload-card audio-card">
      <div>
        <p className="field-label">Audio Input</p>
        <p className="helper-copy">Capture a voice note about the clause you want to check.</p>
      </div>

      <div className="audio-controls">
        {!isRecording ? (
          <button className="ghost-button" type="button" onClick={startRecording} disabled={isAnalyzing}>
            Record audio
          </button>
        ) : (
          <button className="ghost-button danger" type="button" onClick={stopRecording} disabled={isAnalyzing}>
            Stop recording
          </button>
        )}
        {/* audio status indicator */}
        <div className="audio-status">
          {audioBlob ? (
            <span className="audio-ready">
              <span className="audio-dot" aria-hidden />
              Audio ready
            </span>
          ) : (
            <span className="status-pill muted">{status}</span>
          )}
        </div>
      </div>

      <div className="file-status">
        {audioBlob ? <span className="file-name">Audio captured</span> : <span>No audio stored yet</span>}
      </div>

      {audioTranscript ? (
        <p className="helper-copy transcript-preview">Transcript available for preview in the results panel.</p>
      ) : null}
    </div>
  );
}

export default AudioRecorder;