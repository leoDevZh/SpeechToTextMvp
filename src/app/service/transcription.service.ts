import {Injectable, WritableSignal} from '@angular/core';
import {TranscriptionStrategy, TranscriptionStrategyAPI} from "./transcriptionStrategy/TranscriptionStrategy";
import {TranscriptionData} from "./transcriptionStrategy/model";

@Injectable({
  providedIn: 'root'
})
export class TranscriptionService implements TranscriptionStrategyAPI {

  private strategy?: TranscriptionStrategy

  setStrategy(transcriptionStrategy: TranscriptionStrategy) {
    this.strategy = transcriptionStrategy
  }

  startTranscription(): WritableSignal<TranscriptionData[]> {
    if (!this.strategy) throw new Error('No Transcriptionstrategy provided')
    return this.strategy.startTranscription()
  }

  stopTranscription(): void {
    if (!this.strategy) throw new Error('No Transcriptionstrategy provided')
    this.strategy.stopTranscription()
  }

}
