'use client';

import { useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorAudioRecorder } from '@capgo/capacitor-audio-recorder';

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

  const createFileFromNativeUri = async (uri: string) => {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new File([blob], `customer-audio-${Date.now()}.m4a`, {
      type: blob.type || 'audio/mp4',
    });
  };

  const startNativeRecording = async () => {
    const permission = await CapacitorAudioRecorder.checkPermissions();

    if (permission.recordAudio !== 'granted') {
      const requested = await CapacitorAudioRecorder.requestPermissions();

      if (requested.recordAudio !== 'granted') {
        setError('Microphone permission is required to record audio.');
        return;
      }
    }

    await CapacitorAudioRecorder.startRecording({
      bitRate: 128000,
      sampleRate: 44100,
    });

    setIsRecording(true);
  };

  const stopNativeRecording = async () => {
    const result = await CapacitorAudioRecorder.stopRecording();

    if (!result.uri) {
      setError('Recording stopped but audio file was not created.');
      setIsRecording(false);
      return;
    }

    const file = await createFileFromNativeUri(result.uri);
    const url = URL.createObjectURL(file);

    setAudioUrl(url);
    onRecordingReady(file);
    setIsRecording(false);
  };

  const startWebRecording = async () => {
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
      mimeType ? { mimeType } : undefined,
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
  };

  const startRecording = async () => {
    try {
      setError('');
      setAudioUrl('');
      onRecordingReady(null);

      if (Capacitor.isNativePlatform()) {
        await startNativeRecording();
      } else {
        await startWebRecording();
      }
    } catch (err) {
      console.error(err);
      setError('Microphone permission denied or recorder failed to start.');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    try {
      if (Capacitor.isNativePlatform()) {
        await stopNativeRecording();
        return;
      }

      recorderRef.current?.stop();
      setIsRecording(false);
    } catch (err) {
      console.error(err);
      setError('Recording failed to stop properly.');
      setIsRecording(false);
    }
  };

  const clearRecording = () => {
    setAudioUrl('');
    onRecordingReady(null);
    chunksRef.current = [];
  };

  return (
    <div className="rounded-xl border border-blue-200 bg-white p-4">
      <p className="mb-2 text-sm font-black text-blue-800">
        🎙 Record Voice Note
      </p>

      <div className="flex flex-wrap gap-2">
        {!isRecording ? (
          <button
            type="button"
            onClick={startRecording}
            className="rounded-2xl bg-green-600 px-4 py-3 text-xs font-black text-white shadow hover:bg-green-700"
          >
            Start Recording
          </button>
        ) : (
          <button
            type="button"
            onClick={stopRecording}
            className="rounded-2xl bg-red-600 px-4 py-3 text-xs font-black text-white shadow hover:bg-red-700"
          >
            Stop Recording
          </button>
        )}

        {audioUrl && (
          <button
            type="button"
            onClick={clearRecording}
            className="rounded-2xl bg-gray-600 px-4 py-3 text-xs font-black text-white shadow hover:bg-gray-700"
          >
            Remove Recording
          </button>
        )}
      </div>

      {isRecording && (
        <p className="mt-3 text-sm font-black text-red-600">
          ● Recording...
        </p>
      )}

      {audioUrl && (
        <audio controls src={audioUrl} className="mt-3 w-full" />
      )}

      {error && (
        <p className="mt-3 text-sm font-semibold text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}