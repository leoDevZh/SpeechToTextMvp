import {inject, Injectable, OnDestroy} from '@angular/core';
import {Observable, Subject} from "rxjs";
import {AudioVisualizerService} from "./audio-visualizer.service";

@Injectable({
  providedIn: 'root'
})
export class AudioRecorderService implements OnDestroy {

  private recorder?: MediaRecorder
  private chunks$!: Subject<Blob[]>
  private buffer: Blob[] = []

  private audioVisualizer = inject(AudioVisualizerService)

  ngOnDestroy() {
    this.chunks$.complete()
    this.recorder?.stop()
  }

  async startAudioRecording(timeslice: number): Promise<Observable<Blob[]>> {
    if (this.recorder && this.recorder.state === 'paused') {
      this.recorder.resume()
      this.audioVisualizer.startRecording()
    }
    else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // setup visualization
      this.audioVisualizer.setStream(stream)
      this.audioVisualizer.startRecording()
      // setup recording
      this.recorder = new MediaRecorder(stream, { mimeType: 'audio/ogg; codecs=opus' })
      this.recorder.ondataavailable = (event) => {
        this.buffer.push(event.data)
        this.recorder!.stop()
      }
      this.recorder.onstop = () => {
        this.chunks$.next(this.buffer)
        this.buffer = []
        setTimeout(() => this.recorder?.start(timeslice))
      }
      this.recorder.start(timeslice)
    }
    this.chunks$ = new Subject<Blob[]>()
    return this.chunks$.asObservable()
  }

  stopAudioRecording() {
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.pause()
      this.chunks$.complete()
      this.audioVisualizer.stopRecording()
    }
  }
}
