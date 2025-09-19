import {inject, Injectable, NgZone} from '@angular/core';
import {Observable, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class AudioVisualizerService {
  private WIDTH = 1440
  private HEIGHT = (this.WIDTH * 2) / 3

  private canvas!: HTMLCanvasElement
  private canvasCtx!: CanvasRenderingContext2D
  private audioCtx!: AudioContext
  private analyser!: AnalyserNode
  private source!: MediaStreamAudioSourceNode | MediaElementAudioSourceNode
  private dataArray!: Uint8Array
  private stream?: MediaStream
  private $canvas: Subject<HTMLCanvasElement> = new Subject()
  private isRecording = false

  private zone = inject(NgZone)

  setStream(stream: MediaStream) {
    this.stream = stream
    this.initCanvas()
  }

  stopRecording() {
    this.isRecording = false
  }

  startRecording() {
    this.isRecording = true
  }

  setCanvasDimension(width: number, height: number) {
    this.WIDTH = width
    this.HEIGHT = height
  }

  getCanvas(): Observable<HTMLCanvasElement> {
    return this.$canvas.asObservable()
  }

  private initCanvas() {
    // Setup canvas
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.WIDTH
    this.canvas.height = this.HEIGHT
    this.canvasCtx = this.canvas.getContext('2d') as CanvasRenderingContext2D

    // Setup audio context & analyser
    this.audioCtx = new AudioContext()
    this.analyser = this.audioCtx.createAnalyser()
    this.analyser.fftSize = 2048
    this.source = this.audioCtx.createMediaStreamSource(this.stream!)
    this.source.connect(this.analyser)
    const bufferLength = this.analyser.frequencyBinCount
    this.dataArray = new Uint8Array(bufferLength)
    this.startDrawing();
    this.$canvas.next(this.canvas)
  }

  private startDrawing() {
    this.zone.runOutsideAngular(() => {
      const draw = () => {
        requestAnimationFrame(draw)
        this.analyser.getByteFrequencyData(this.dataArray)
        this.canvasCtx.fillStyle = '#2a2d35'
        this.canvasCtx.fillRect(0, 0, this.WIDTH, this.HEIGHT)

        // Bars
        const barWidth = (this.WIDTH / this.dataArray.length) * 3
        let x = 0
        for (let i = 0; i < this.dataArray.length; i++) {
          const barHeight = this.isRecording ? Math.pow(this.dataArray[i] / 16, 2) : 1
          this.canvasCtx.fillStyle = 'rgb(215, 255, 255)'
          this.canvasCtx.fillRect(x, (this.HEIGHT / 2) - barHeight, barWidth, barHeight * 2)
          x += barWidth + 15
        }
      }
      draw()
    })
  }
}
