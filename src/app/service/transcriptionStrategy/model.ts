export interface TranscriptionData {
  id: number,
  text: string,
  audio: Blob[],
  status: 'VERIFIED' | 'UNVERIFIED' | 'UNPROCESSED'
}
