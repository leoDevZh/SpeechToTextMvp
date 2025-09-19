import {Component, Directive, inject, OnDestroy, WritableSignal} from "@angular/core";
import {TranscriptionData} from "./model";
import {Subscription} from "rxjs";
import {AudioRecorderService} from "../audio-recorder.service";
import {WebSocketService} from "../web-socket.service";
import {OrderedDataService} from "../ordered-data.service";

export interface TranscriptionStrategyAPI {
  startTranscription(): WritableSignal<TranscriptionData[]>

  stopTranscription(): void
}

export abstract class TranscriptionStrategy implements TranscriptionStrategyAPI {

  protected blobSubscription!: Subscription
  protected serverResultSubscription!: Subscription
  protected currentId = 0
  protected transcriptionDataBuffer: Record<number, TranscriptionData> = {}

  protected audioRecorder = inject(AudioRecorderService)
  protected webSocket = inject(WebSocketService)
  protected dataService = inject(OrderedDataService)

  abstract startTranscription(): WritableSignal<TranscriptionData[]>

  abstract stopTranscription(): void

  protected addUnprocessedData(data: TranscriptionData) {
    this.transcriptionDataBuffer[data.id] = data
  }

  protected getUnprocessedDataById(id: number): TranscriptionData {
    return this.transcriptionDataBuffer[id]
  }

  protected deleteUnprocessedDataById(id: number) {
    delete this.transcriptionDataBuffer[id]
  }
}

@Directive()
export class SinglePassTranscriptionStrategy extends TranscriptionStrategy implements OnDestroy {

  constructor() {
    super()
  }

  ngOnDestroy() {
    this.stopTranscription()
    this.stopWebserver()
  }

  startTranscription(): WritableSignal<TranscriptionData[]> {
    this.startWebserver()
    this.dataService.reset()
    this.currentId = 0
    this.audioRecorder.startAudioRecording(3000).then(blob$ => {
      this.blobSubscription = blob$.subscribe(chunk => {
        try {
          this.webSocket.sendData(chunk, this.currentId)
          this.addUnprocessedData({
            id: this.currentId,
            text: '',
            status: 'UNPROCESSED',
            audio: chunk
          })
          this.currentId += 1
        } catch (e) {
          this.stopTranscription()
        }
      })
    })
    return this.dataService.sortedData
  }

  stopTranscription() {
    this.stopWebserver()
    this.blobSubscription?.unsubscribe()
    this.audioRecorder.stopAudioRecording()
  }

  private startWebserver() {
    this.serverResultSubscription = this.webSocket.startWebSocket().subscribe(this.webserverDataHandler)
  }

  private stopWebserver() {
    this.serverResultSubscription.unsubscribe()
    this.webSocket.stopWebSocket()
  }

  private webserverDataHandler = (jsonData: string) => {
    try {
      const parsedJson = JSON.parse(jsonData)
      const data = this.getUnprocessedDataById(parsedJson.id)
      if (!data) return

      this.deleteUnprocessedDataById(parsedJson.id)
      data.text = parsedJson.text
      data.status = 'VERIFIED'
      this.dataService.addData(data)
    } catch (err) {
      console.error('Invalid JSON from WebSocket:', jsonData, err)
    }
  }
}
