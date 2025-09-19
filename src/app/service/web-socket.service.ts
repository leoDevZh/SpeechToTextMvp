import { Injectable } from '@angular/core';
import {Observable, Subject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws?: WebSocket
  private receivedData$!: Subject<any>
  private resultObservable$!: Observable<any>

  startWebSocket() {
    this.setupObservable()
    this.setupWebSocket()
    return this.resultObservable$
  }

  stopWebSocket() {
    this.ws?.close()
    this.receivedData$.complete()
  }

  sendData(audioData: Blob[], id: number) {
    if (this.isInvalidState) throw new Error('Web Socket Service in invalid state for sending data')
    new Blob(audioData, { type: "audio/ogg; codecs=opus" }).arrayBuffer().then(audioBuffer => {
      const fullBuffer = new ArrayBuffer(4 + audioBuffer.byteLength)
      const view = new DataView(fullBuffer)
      view.setUint32(0, id, true)
      const audioView = new Uint8Array(fullBuffer, 4)
      audioView.set(new Uint8Array(audioBuffer))
      this.ws!.send(fullBuffer)
    })
  }

  private setupObservable() {
    this.receivedData$ = new Subject()
    this.resultObservable$ = this.receivedData$.asObservable()
  }

  private setupWebSocket() {
    if(this.ws && !this.ws?.CLOSED) {
      return
    }
    this.ws = new WebSocket('ws://127.0.0.1:8000/ws/audio')

    this.ws.onerror = err => {console.log(`Error with Socket: ${err}`)}
    this.ws.onclose = () => {console.log('Socket closed'); this.ws = undefined}
    this.ws.onmessage = event => {this.receivedData$.next(event.data)}
  }

  private get isInvalidState():boolean {
    return !this.ws || !this.ws.OPEN || !this.receivedData$ || this.receivedData$.closed
  }
}
