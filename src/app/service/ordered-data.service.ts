import {Injectable, signal} from '@angular/core';
import {TranscriptionData} from "./transcriptionStrategy/model";

@Injectable({
  providedIn: 'root'
})
export class OrderedDataService {

  sortedData = signal<TranscriptionData[]>([])

  private buffer: Record<number, TranscriptionData> = {}
  private nextIdx = 0

  constructor() { }

  addData(data: TranscriptionData) {
    if (!this.buffer[data.id]) {
      this.buffer[data['id']] = data
    }
    this.processData()
  }

  addBatch(data: TranscriptionData, offset: number) {
    this.sortedData.update(currentData => {
      let newArray: TranscriptionData[] = currentData
      if (this.nextIdx >= data.id) {
        newArray = [...currentData.slice(0, data.id), data, ...currentData.slice(data.id + offset)]
        this.nextIdx = Math.max(this.nextIdx, data.id + offset)
        for (let i = data.id; i < data.id + offset; i++) {
          delete this.buffer[i]
        }
      } else {
        this.buffer[data.id] = data
        for (let i = data.id + 1; i < data.id + offset; i++) {
          this.buffer[i] = {...data, id: i, text: ''}
        }
      }
      return newArray
    })
  }

  reset() {
    this.nextIdx = 0
    this.buffer = {}
  }

  private processData() {
    while (this.buffer[this.nextIdx]) {
      const item = this.buffer[this.nextIdx]
      this.sortedData.update(currentData => [...currentData, item])
      delete this.buffer[this.nextIdx]
      this.nextIdx++
    }
  }
}
