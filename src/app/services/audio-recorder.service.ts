import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { VoiceRecorder, RecordingData } from 'capacitor-voice-recorder';

@Injectable({
  providedIn: 'root',
})
export class AudioRecorderService {
  isRecording = signal(false);
  isSupported = signal(true);

  async requestPermission(): Promise<boolean> {
    const result = await VoiceRecorder.requestAudioRecordingPermission();
    return result.value;
  }

  async startRecording(): Promise<void> {
    try {
      // Check/request permission first
      const hasPermission = await VoiceRecorder.hasAudioRecordingPermission();
      if (!hasPermission.value) {
        const permission =
          await VoiceRecorder.requestAudioRecordingPermission();
        if (!permission.value) {
          throw new Error(
            'Microphone permission denied. Please allow microphone access in Settings.',
          );
        }
      }

      await VoiceRecorder.startRecording();
      this.isRecording.set(true);
    } catch (error: any) {
      console.error('Start recording error:', error);
      if (
        error.message?.includes('permission') ||
        error.message?.includes('Permission')
      ) {
        throw new Error(
          'Microphone permission denied. Please allow microphone access in Settings.',
        );
      }
      throw new Error('Failed to start recording: ' + (error.message || error));
    }
  }

  async stopRecording(): Promise<Blob> {
    try {
      const result: RecordingData = await VoiceRecorder.stopRecording();
      this.isRecording.set(false);

      if (!result.value?.recordDataBase64) {
        throw new Error('No recording data received');
      }

      // Convert base64 to Blob
      const base64 = result.value.recordDataBase64;
      const mimeType = result.value.mimeType || 'audio/aac';

      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      return blob;
    } catch (error: any) {
      this.isRecording.set(false);
      console.error('Stop recording error:', error);
      throw new Error('Failed to stop recording: ' + (error.message || error));
    }
  }

  cancelRecording(): void {
    if (this.isRecording()) {
      VoiceRecorder.stopRecording().catch(() => {});
      this.isRecording.set(false);
    }
  }
}
