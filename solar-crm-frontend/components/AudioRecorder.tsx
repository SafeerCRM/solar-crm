'use client';

import { useRef, useState } from 'react';

type Props = {
  onRecordingReady: (file: File | null) => void;
};

export default function AudioRecorder({ onRecordingReady }: Props) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');

  const startRecording = async () => {
    try {
      setError('');
      setAudioUrl('');
      onRecordingReady(null);
      chunksRef.current = [];

      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Audio recording is not supported on this device/browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined
      );

      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || 'audio/webm',
        });

        const file = new File([blob], `customer-audio-${Date.now()}.webm`, {
          type: blob.type,
        });

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingReady(file);

        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error(err);
      setError('Microphone permission denied or recorder failed to start.');
    }
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setIsRecording(false);
  };

  const clearRecording = () => {
    setAudioUrl('');
    onRecordingReady(null);
    chunksRef.current = [];
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="mb-2 text-sm font-semibold text-gray-700">
        Record Audio
      </p>

      <div className="flex flex-wrap gap-2">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Start Recording
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Stop Recording
          </button>
        )}

        {audioUrl && (
          <button
            type="button"
            onClick={clearRecording}
            className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Remove Recording
          </button>
        )}
      </div>

      {isRecording && (
        <p className="mt-2 text-sm font-semibold text-red-600">
          Recording...
        </p>
      )}

      {audioUrl && (
        <audio controls src={audioUrl} className="mt-3 w-full" />
      )}

      {error && (
        <p className="mt-2 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}

      <p className="mt-2 text-xs text-gray-500">
        If recording does not work, customer can still upload an audio file.
      </p>
    </div>
  );
}