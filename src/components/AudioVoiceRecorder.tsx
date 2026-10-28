import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';

interface AudioVoiceRecorderProps {
  onSendAudio: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export const AudioVoiceRecorder: React.FC<AudioVoiceRecorderProps> = ({
  onSendAudio,
  onCancel,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    startRecording();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(finalBlob);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      alert('Could not access microphone. Please enable microphone permissions in your browser.');
      onCancel();
    }
  };

  const handleStopAndSend = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const finalBlob = new Blob(chunksRef.current, { type: mimeType });
        cleanup();
        onSendAudio(finalBlob, recordingSeconds);
      };
      mediaRecorderRef.current.stop();
    } else if (audioBlob) {
      cleanup();
      onSendAudio(audioBlob, recordingSeconds);
    }
  };

  const handleCancel = () => {
    cleanup();
    onCancel();
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex-1 flex items-center justify-between bg-[#202c33] rounded-lg px-4 py-2 border border-[#374248] animate-in fade-in">
      <div className="flex items-center gap-3">
        {/* Pulsing red mic icon */}
        <div className="relative flex items-center justify-center">
          <span className="w-3 h-3 bg-red-500 rounded-full animate-ping absolute" />
          <span className="w-3 h-3 bg-red-500 rounded-full" />
        </div>
        <span className="font-mono text-sm text-[#e9edef] font-medium">
          {formatTimer(recordingSeconds)}
        </span>
        <span className="text-xs text-[#8696a0] hidden sm:inline">
          Recording voice note...
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="text-[#8696a0] hover:text-red-400 p-2 rounded-full hover:bg-[#111b21] transition-colors"
          title="Cancel recording"
        >
          <Trash2 className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={handleStopAndSend}
          className="bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] p-2.5 rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center"
          title="Send voice note"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
