import { TestBed } from '@angular/core/testing';

import { OrderedDataService } from './ordered-data.service';
import {TranscriptionData} from "./transcriptionStrategy/model";

describe('OrderedDataService', () => {
  let service: OrderedDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderedDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addData', () => {
    it('on data in correct order', () => {
      const mockData: TranscriptionData = {
        id: 0,
        status: "VERIFIED",
        text: 'Bla',
        audio: []
      }
      service.addData(mockData)
      service.addData({...mockData, id: 1})
      expect(service.sortedData()).toEqual([mockData, {...mockData, id: 1}])
    });

    it('on data in incorrect order', () => {
      const mockData: TranscriptionData = {
        id: 0,
        status: "VERIFIED",
        text: 'Bla',
        audio: []
      }
      service.addData({...mockData, id: 1})
      service.addData(mockData)
      expect(service.sortedData()).toEqual([mockData, {...mockData, id: 1}])
    });

    it('on missing data inbetween', () => {
      const mockData: TranscriptionData = {
        id: 0,
        status: "VERIFIED",
        text: 'Bla',
        audio: []
      }
      service.addData(mockData)
      service.addData({...mockData, id: 1})
      service.addData({...mockData, id: 3})
      expect(service.sortedData()).toEqual([mockData, {...mockData, id: 1}])
      service.addData({...mockData, id: 2})
      expect(service.sortedData()).toEqual([mockData, {...mockData, id: 1}, {...mockData, id: 2}, {...mockData, id: 3}])
    });
  })

  describe('addBatch', () => {
    it('on batch at end of current data', () => {
      const mockData: TranscriptionData = {
        id: 0,
        status: "VERIFIED",
        text: 'Bla',
        audio: []
      }
      service.sortedData.set([mockData, {...mockData, id: 1}, {...mockData, id: 2}])
      service.addBatch({...mockData, text: 'Blabla'}, 3)
      expect(service.sortedData()).toEqual([{...mockData, text: 'Blabla'}])
    });

    it('on batch before end of current data', () => {
      const mockData: TranscriptionData = {
        id: 0,
        status: "VERIFIED",
        text: 'Bla',
        audio: []
      }
      service.sortedData.set([mockData, {...mockData, id: 1}, {...mockData, id: 2}])
      service.addBatch({...mockData, text: 'Blabla'}, 2)
      expect(service.sortedData()).toEqual([{...mockData, text: 'Blabla'}, {...mockData, id: 2}])
    });

    it('on batch after end of current data', () => {
      const mockData: TranscriptionData = {
        id: 0,
        status: "VERIFIED",
        text: 'Bla',
        audio: []
      }
      service.addData(mockData)
      service.addData({...mockData, id: 1})
      service.addBatch({...mockData, id: 3, text: 'Blabla'}, 2)
      expect(service.sortedData()).toEqual([mockData, {...mockData, id: 1}])
      service.addData({...mockData, id: 2})
      expect(service.sortedData()).toEqual([mockData, {...mockData, id: 1}, {...mockData, id: 2}, {...mockData, id: 3, text: 'Blabla'}, {...mockData, id: 4, text: ''}])
      service.addData({...mockData, id: 5})
      expect(service.sortedData()).toEqual([mockData, {...mockData, id: 1}, {...mockData, id: 2}, {...mockData, id: 3, text: 'Blabla'}, {...mockData, id: 4, text: ''}, {...mockData, id: 5}])
    });
  })
});
