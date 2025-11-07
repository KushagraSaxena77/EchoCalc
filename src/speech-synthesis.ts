export class VoiceSynthesis {
  private synthesis: SpeechSynthesis | null = null;

  constructor() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
    }
  }

  speak(text: string): void {
    if (!this.synthesis) return;

    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    utterance.lang = 'en-US';

    this.synthesis.speak(utterance);
  }

  isSupported(): boolean {
    return this.synthesis !== null;
  }

  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}
