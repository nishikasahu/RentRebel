import { useEffect, useRef, useState } from 'react';

function AudioRecorder({ audioBlob, setAudioBlob }) {
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
        setStatus('Stopped');
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
          <button className="ghost-button" type="button" onClick={startRecording}>
            Record audio
          </button>
        ) : (
          <button className="ghost-button danger" type="button" onClick={stopRecording}>
            Stop recording
          </button>
        )}
        <span className={`status-pill ${isRecording ? 'warning' : 'muted'}`}>{status}</span>
      </div>

      <div className="file-status">
        {audioBlob ? <span className="file-name">Audio captured</span> : <span>No audio stored yet</span>}
      </div>
    </div>
  );
}

export default AudioRecorder;