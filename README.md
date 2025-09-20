# Speech to Text Transcription MVP (Python/Angular)
<img width="356" height="400" alt="Bildschirmfoto vom 2025-09-19 16-39-27" src="https://github.com/user-attachments/assets/aa3fc523-c073-4842-a905-51af4165eb0a" />

This project is a **minimal viable product (MVP)** for **real-time speech-to-text transcription**, built with:

- **Backend:** FastAPI (Python)
- **Frontend:** Angular
- **Model:** [faster-whisper](https://github.com/SYSTRAN/faster-whisper)

## Problem to solve
I wanted to build a simple application that:
- Records speech in the browser and transcribes it to text **in real time**
- Runs with **minimal resources** (RAM/CPU)
- Has **basic styling** that can be extended in the future
- Provides a **clean and maintainable codebase** for future features

## Solution Overview

### Techstack
- **Frontend (Angular):** My framework of choice for building a structured UI.
- **Backend (FastAPI):** Ideal for serving AI models that are typically Python-based.
  
### Audio Format
Using Audio Codec Opus gives the advantages of high quality audio data with compression. Therefore data latency is minimal and the transcription model can rely on high quality audio data.

### Real Time Translation
The flow is:
1. **Frontend:** Captures audio from the microphone
2. **Backend:** Processes and transcries with faster-whisper
3. **Frontend:** Displays the transcribed text live

#### Communication
To reduce connection overhead I make use of Websockets. With that the connection between Frontend and Backend has to be done only once and after that data can be send with full duplex.
The downside is that depending on the implementation of the backend, it is not guaranteed that the data being send is recieved in the same order. 
To solve this problem a custom binary protocol has been implemented where each audio chunk is prefixed with an id of 4 bytes.

![binaryprot](https://github.com/user-attachments/assets/7ad3b244-f09c-41cd-9926-0889da5f85dc)

#### Parallel Data Processing (Backend)
One could think FastAPI with its async endpoints would be a perfect fit to deal with the continous flow of audio data. But FastAPI async endpoints using coroutines only has its strength in I/O heavy tasks and transcripting audio data to text is a CPU heavy task.
Therefore extra efford is needed to handle the data processing in the backend by using a Processpool. Only with a Processpool it is possible to achieve parallelism in Python where each Process has its own GIL.

### Minimal Ressoruces
Neural Networks for such tasks can quickly use multiple GB of RAM. And if predictions are not being accelerated with a GPU latency is quickly to high for Real Time Translation. To reduce the RAM usage and latency only a small model can be used which reduces the accuracy of the transcription.

### Styling
For styling I make use of GSAP for the text animation and CSS for the rest. As a little extra I visualize the audio stream using canvas and AudioContext.

### Architecture
There is actually just one thing to say. **Define Responsibilities**.

The following graphics gives an overview of the Frontend Services.

![STTA](https://github.com/user-attachments/assets/33756188-e138-452b-a565-b469a3b512c9)

## Installaton & Running the App
```bash
# Clone the repo
git clone https://github.com/leoDevZh/speech-to-text-mvp.git
cd speech-to-text-mvp

# Backend setup
cd backend
pip install -r requirements.txt
uvicorn app:app --reload

# Frontend setup
cd ../frontend
npm install
npm start
```

## Future improvements
- Improve transcription **accuracy** with larger models
- Enhance **UI/UX**
- Add **authentication** for multi-user scenarios
