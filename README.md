# Speech to Text Transcription MVP (Python/Angular)
<img width="356" height="400" alt="Bildschirmfoto vom 2025-09-19 16-39-27" src="https://github.com/user-attachments/assets/aa3fc523-c073-4842-a905-51af4165eb0a" />

In this project I have created a mvp for speech to text transcription. Using FastAPI (Python) in the Backend and Angular in the Frontend.
For the model I make use of [faster-whisper](https://github.com/SYSTRAN/faster-whisper)

## Problem to solve
I have defined the following requirements:
- I want to record my speech in the browser and translate it to text in real time
- I want to be able to run the app with minimal ressources
- I want some basic styling that can be easily improved for the future

## How I solved it

### Techstack
For the Frontend I am using Angular because of personal preferences.
For the Backend I make use of FastAPI because most AI Models will be provided via Python libraries.

### Audio Format
Using Audio Codec Opus gives the advantages of high quality audio data with compression. Therefore data latency is minimal and the transcription model can rely on high quality audio data.

### Real Time Translation
Audio recording is being done in the frontend, audio to text transcription in the backend that has to be displayed in the frontend again. 
To achieve Real Time Translation a continuous data flow between frontend and backend needs to be achieved.

#### Communication
To reduce connection overhead I make use of Websockets. With that the connection between Frontend and Backend has to be done only once and after that data can be send with full duplex.
The downside is that depending on the implementation of the backend, it is not guaranteed that the data being send is recieved in the same order. 
To solve this problem a custom binary protocol has been implemented where each audio chunk is prefixed with an id of 4 bytes.

![binaryprot](https://github.com/user-attachments/assets/7ad3b244-f09c-41cd-9926-0889da5f85dc)

#### Parallel Data Processing (Backend)
One could think FastAPI with its async endpoints would be a perfect fit to deal with the continous flow of audio data. But FastAPI async endpoints using coroutines only has its strength in IO heavy tasks and transcripting audio data to text is a CPU heavy task.
Therefore extra efford is needed to handle the data processing in the backend by using a Processpool. Only with a Processpool it is possible to achieve parallelism in Python where each Process has its own GIL.

### Minimal Ressoruces

Neural Networks for such tasks can quickly use multiple GB of RAM. To reduce the RAM usage only a small model can be used which reduces the accuracy of the transcription.


### Styling
For styling I make use of GSAP for the text animation and CSS for the rest.
