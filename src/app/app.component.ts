import {
  AfterViewChecked,
  Component,
  ElementRef,
  inject,
  OnDestroy, OnInit,
  QueryList,
  ViewChild,
  ViewChildren,
  WritableSignal
} from '@angular/core';
import {TranscriptionService} from "./service/transcription.service";
import {SinglePassTranscriptionStrategy} from "./service/transcriptionStrategy/TranscriptionStrategy";
import {TranscriptionData} from "./service/transcriptionStrategy/model";
import {DomSanitizer} from "@angular/platform-browser";
import gsap from "gsap";
import {SplitText} from "gsap/SplitText";
import {AudioVisualizerService} from "./service/audio-visualizer.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div class="controller-container">
        <div class="grid">
          <button (click)="toggleRecording()" [innerHtml]="buttonIcon"></button>
          <div #canvasContainer></div>
        </div>
    </div>
    <div #scrollContainer class="transcription-container">
      <p>
        @if (data) {
          @for (item of data(); track item.id) {
            <span #transcriptionSpan [attr.data-id]="item.id" [class.unverified]="item.status === 'UNVERIFIED'">{{item.text}}</span>
          }
        }
        @if (isPlaying) {
          <span>
            <span class="dot"> .</span>
            <span class="dot">.</span>
            <span class="dot">.</span>
          </span>
        }
      </p>
    </div>
  `,
  styles: [`
    :host {
      display: grid;
      grid-template-rows: 1fr 2fr;
      width: 100vw;
      height: 100vh;
      align-items: center;
      justify-content: center;
    }

    .controller-container,
    .transcription-container {
      display: flex;
      height: 100%;
      width: min(450px, 90vw);
      box-sizing: border-box;
    }

    .grid {
      height: 95%;
      width: 100%;
      align-self: end;
      display: grid;
      justify-items: center;
      align-items: center;
      grid-template-rows: 1fr 2fr;
      grid-template-columns: 1fr;
      row-gap: 16px;
    }

    .grid > div {
      width: 100%;
      height: 100%;
      align-self: end;
    }

    .transcription-container {
      padding-block: 20px;
      overflow-y: scroll;
      justify-content: start;
      align-items: start;
      -webkit-mask: -webkit-linear-gradient(transparent,white 20%,white 80%,transparent);
      mask: linear-gradient(transparent,white 10%,white 90%,transparent);
      line-height: 1.5;
      font-size: 20px;
    }

    button {
      width: 64px;
      height: 64px;
      padding: 12px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      background: var(--accent) linear-gradient(rgba(255, 255, 255, var(--button-fill)), transparent);
      border: none;
      outline: none;
      color: #fff;
      box-shadow: var(--accent) 0 0 8px, var(--accent) 0 0 12px;
      transition: --button-fill 0.5s ease, box-shadow .2s ease;
    }

    button:hover {
      --button-fill: .001;
      box-shadow: var(--accent) 0 0 10px, var(--accent) 0 0 12px;

    }

    span {
      margin: 0;
      padding: 0;
    }

    .unverified {
      opacity: .4;
    }

    .dot {
      animation: op 2s linear infinite;
    }
    .dot:nth-child(1) {
      animation-delay: 0s;
    }
    .dot:nth-child(2) {
      animation-delay: .2s;
    }
    .dot:nth-child(3) {
      animation-delay: .4s;
    }

    @keyframes op {
      0%  {
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
      100% {
        opacity: 1;
      }
    }

    @keyframes darken {
      from {
        --button-fill: 50%;
      }
      to {
        --button-fill: 0%;
      }
    }

    @property --button-fill {
      syntax: "<number>";
      inherits: false;
      initial-value: .1;
    }
  `]
})
export class AppComponent implements OnInit, AfterViewChecked, OnDestroy {

  private animatedSpans = new Set<number>()

  private transcriptionService = inject(TranscriptionService)
  private sanitizer = inject(DomSanitizer)
  private audioVisualizer = inject(AudioVisualizerService)

  protected data?: WritableSignal<TranscriptionData[]>
  protected isPlaying: boolean = false

  @ViewChildren("transcriptionSpan")
  spans!: QueryList<ElementRef>

  @ViewChild('scrollContainer')
  private scrollContainer!: ElementRef

  @ViewChild('canvasContainer', { static: true })
  canvasContainerRef!: ElementRef<HTMLDivElement>;

  constructor() {
    gsap.registerPlugin(SplitText)
    this.transcriptionService.setStrategy(new SinglePassTranscriptionStrategy())
  }

  ngOnInit() {
    const canvasRect = this.canvasContainerRef.nativeElement.getBoundingClientRect()
    this.audioVisualizer.setCanvasDimension(canvasRect.width, canvasRect.height)
  }

  ngAfterViewChecked() {
    this.scrollToBottom()
    this.addAnimation()
  }

  ngOnDestroy(): void {
    this.transcriptionService.stopTranscription()
  }

  toggleRecording() {
    this.isPlaying = !this.isPlaying

    if (this.isPlaying) {
      this.data = this.transcriptionService.startTranscription()
      this.audioVisualizer.getCanvas()
        .subscribe(canvas => this.canvasContainerRef.nativeElement.appendChild(canvas))
    } else {
      this.transcriptionService.stopTranscription()
    }
  }

  get buttonIcon() {
    return this.sanitizer.bypassSecurityTrustHtml(this.isPlaying ?
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3H8V21H6V3ZM16 3H18V21H16V3Z"></path></svg>'
  :
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.9998 3C10.3429 3 8.99976 4.34315 8.99976 6V10C8.99976 11.6569 10.3429 13 11.9998 13C13.6566 13 14.9998 11.6569 14.9998 10V6C14.9998 4.34315 13.6566 3 11.9998 3ZM11.9998 1C14.7612 1 16.9998 3.23858 16.9998 6V10C16.9998 12.7614 14.7612 15 11.9998 15C9.23833 15 6.99976 12.7614 6.99976 10V6C6.99976 3.23858 9.23833 1 11.9998 1ZM3.05469 11H5.07065C5.55588 14.3923 8.47329 17 11.9998 17C15.5262 17 18.4436 14.3923 18.9289 11H20.9448C20.4837 15.1716 17.1714 18.4839 12.9998 18.9451V23H10.9998V18.9451C6.82814 18.4839 3.51584 15.1716 3.05469 11Z"></path></svg>')
  }

  private scrollToBottom() {
    this.scrollContainer.nativeElement.scrollTo({
      top: this.scrollContainer.nativeElement.scrollHeight,
      behavior: 'smooth'
    })
  }

  private addAnimation() {
    this.spans.forEach(spanRef => {
      const el = spanRef.nativeElement;
      const dataIdAttr = el.getAttribute('data-id') as number
      if (el.innerText && !this.animatedSpans.has(dataIdAttr)) {
        this.animatedSpans.add(dataIdAttr)
        const split = SplitText.create(el, {
          type: 'chars'
        })
        gsap.from(split.chars, {
          autoAlpha: 0,
          stagger: 0.05,
          ease: "power2.out"
        })
      }
    })
  }
}
