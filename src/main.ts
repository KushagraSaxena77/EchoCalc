import './style.css';
import { VoiceRecognition } from './speech-recognition';
import { SpeechParser } from './speech-parser';
import { Calculator } from './calculator';
import { VoiceSynthesis } from './speech-synthesis';
import { saveCalculation, getCalculationHistory, clearCalculationHistory, CalculationHistory } from './supabase';

class VoiceCalculatorApp {
  private voiceRecognition: VoiceRecognition;
  private speechParser: SpeechParser;
  private calculator: Calculator;
  private voiceSynthesis: VoiceSynthesis;
  private history: CalculationHistory[] = [];

  private elements = {
    transcript: document.getElementById('transcript')!,
    expression: document.getElementById('expression')!,
    result: document.getElementById('result')!,
    listenBtn: document.getElementById('listenBtn')!,
    clearBtn: document.getElementById('clearBtn')!,
    speakBtn: document.getElementById('speakBtn')!,
    status: document.getElementById('status')!,
    displaySection: document.getElementById('displaySection')!,
    historyList: document.getElementById('historyList')!,
    clearHistoryBtn: document.getElementById('clearHistoryBtn')!,
    editBtn: document.getElementById('editBtn')!,
    editorModal: document.getElementById('editorModal')!,
    expressionInput: document.getElementById('expressionInput') as HTMLInputElement,
    editorSaveBtn: document.getElementById('editorSaveBtn')!,
    editorCancelBtn: document.getElementById('editorCancelBtn')!,
    editorCloseBtn: document.getElementById('editorCloseBtn')!
  };

  constructor() {
    this.voiceRecognition = new VoiceRecognition();
    this.speechParser = new SpeechParser();
    this.calculator = new Calculator();
    this.voiceSynthesis = new VoiceSynthesis();

    this.initializeApp();
  }

  private async initializeApp() {
    this.checkBrowserSupport();
    this.setupEventListeners();
    await this.loadHistory();
  }

  private checkBrowserSupport() {
    if (!this.voiceRecognition.isSupported()) {
      this.showStatus('Speech recognition is not supported in this browser', 'error');
      this.elements.listenBtn.setAttribute('disabled', 'true');
    }

    if (!this.voiceSynthesis.isSupported()) {
      this.elements.speakBtn.style.display = 'none';
    }
  }

  private setupEventListeners() {
    this.elements.listenBtn.addEventListener('click', () => this.toggleListening());
    this.elements.clearBtn.addEventListener('click', () => this.clearDisplay());
    this.elements.speakBtn.addEventListener('click', () => this.speakResult());
    this.elements.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    this.elements.editBtn.addEventListener('click', () => this.openEditor());
    this.elements.editorSaveBtn.addEventListener('click', () => this.saveEditedExpression());
    this.elements.editorCancelBtn.addEventListener('click', () => this.closeEditor());
    this.elements.editorCloseBtn.addEventListener('click', () => this.closeEditor());

    this.elements.editorModal.addEventListener('click', (e) => {
      if (e.target === this.elements.editorModal) this.closeEditor();
    });

    this.voiceRecognition.onResult((text) => this.handleSpeechResult(text));
    this.voiceRecognition.onError((error) => this.handleSpeechError(error));
  }

  private toggleListening() {
    if (this.voiceRecognition.getIsListening()) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  private startListening() {
    this.voiceRecognition.startListening();
    this.elements.listenBtn.innerHTML = '<span class="btn-icon">⏹</span> Stop';
    this.elements.displaySection.classList.add('listening');
    this.showStatus('Listening... Speak your calculation', 'info');
  }

  private stopListening() {
    this.voiceRecognition.stopListening();
    this.elements.listenBtn.innerHTML = '<span class="btn-icon">🎤</span> Start Listening';
    this.elements.displaySection.classList.remove('listening');
    this.showStatus('Ready to listen', 'info');
  }

  private async handleSpeechResult(transcript: string) {
    this.stopListening();

    this.elements.transcript.textContent = transcript;

    try {
      const expression = this.speechParser.parse(transcript);
      this.elements.expression.textContent = expression;

      const result = this.calculator.evaluate(expression);
      const formattedResult = this.calculator.formatResult(result);

      this.elements.result.textContent = formattedResult;
      this.showStatus('Calculation complete!', 'success');

      await saveCalculation(transcript, expression, formattedResult);
      await this.loadHistory();

      if (this.voiceSynthesis.isSupported()) {
        this.voiceSynthesis.speak(`The answer is ${formattedResult}`);
      }
    } catch (error) {
      this.elements.expression.textContent = 'Error parsing expression';
      this.elements.result.textContent = '—';
      this.showStatus('Could not calculate. Please try again.', 'error');
    }
  }

  private handleSpeechError(error: string) {
    this.stopListening();

    if (error === 'no-speech') {
      this.showStatus('No speech detected. Please try again.', 'error');
    } else if (error === 'not-allowed') {
      this.showStatus('Microphone access denied. Please allow microphone access.', 'error');
    } else {
      this.showStatus(`Error: ${error}`, 'error');
    }
  }

  private clearDisplay() {
    this.elements.transcript.textContent = 'Press "Start Listening" and speak your calculation';
    this.elements.expression.textContent = '';
    this.elements.result.textContent = '—';
    this.showStatus('Ready to listen', 'info');
  }

  private speakResult() {
    const resultText = this.elements.result.textContent;
    if (resultText && resultText !== '—') {
      this.voiceSynthesis.speak(`The answer is ${resultText}`);
    }
  }

  private async loadHistory() {
    try {
      this.history = await getCalculationHistory(20);
      this.renderHistory();
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  private renderHistory() {
    if (this.history.length === 0) {
      this.elements.historyList.innerHTML = '<div class="history-empty">No calculations yet. Start by speaking a calculation!</div>';
      return;
    }

    this.elements.historyList.innerHTML = this.history
      .map(item => `
        <div class="history-item">
          <div class="history-transcript">"${item.transcript}"</div>
          <div class="history-expression">${item.expression}</div>
          <div class="history-result">= ${item.result}</div>
        </div>
      `)
      .join('');
  }

  private async clearHistory() {
    try {
      await clearCalculationHistory();
      this.history = [];
      this.renderHistory();
      this.showStatus('History cleared', 'success');
    } catch (error) {
      this.showStatus('Failed to clear history', 'error');
    }
  }

  private showStatus(message: string, type: 'info' | 'error' | 'success') {
    this.elements.status.textContent = message;
    this.elements.status.className = `status ${type}`;
  }

  private openEditor() {
    const currentExpression = this.elements.expression.textContent || '';
    this.elements.expressionInput.value = currentExpression;
    this.elements.editorModal.classList.add('open');
    this.elements.expressionInput.focus();
  }

  private closeEditor() {
    this.elements.editorModal.classList.remove('open');
  }

  private async saveEditedExpression() {
    const editedExpression = this.elements.expressionInput.value.trim();

    if (!editedExpression) {
      this.showStatus('Expression cannot be empty', 'error');
      return;
    }

    try {
      this.elements.expression.textContent = editedExpression;

      const result = this.calculator.evaluate(editedExpression);
      const formattedResult = this.calculator.formatResult(result);

      this.elements.result.textContent = formattedResult;
      this.showStatus('Calculation complete!', 'success');

      const transcript = this.elements.transcript.textContent || '';
      await saveCalculation(transcript, editedExpression, formattedResult);
      await this.loadHistory();

      this.closeEditor();

      if (this.voiceSynthesis.isSupported()) {
        this.voiceSynthesis.speak(`The answer is ${formattedResult}`);
      }
    } catch (error) {
      this.elements.result.textContent = '—';
      this.showStatus('Invalid expression. Please check and try again.', 'error');
    }
  }
}

function renderLanding(container: HTMLElement) {
  container.innerHTML = `
    <div class="container">
      <div class="header" style="text-align:center;">
        <h1>EchoCalc</h1>
        <p>Speak naturally and let AI handle the math</p>
      </div>

      <div class="display-section" style="min-height: 0; padding: 32px; align-items:center; text-align:center;">
        <p style="margin-bottom:16px; color:#666;">A voice-powered calculator with local history</p>
        <button id="startAppBtn" class="btn btn-primary" style="max-width:260px; margin:0 auto;">
          <span class="btn-icon">▶️</span> Start
        </button>
      </div>

      <div class="history-section" style="border-top:none;">
        <div class="history-list">
          <div class="history-empty">Tip: You’ll be asked for microphone access on the next screen.</div>
        </div>
      </div>
    </div>
  `;

  const startBtn = document.getElementById('startAppBtn');
  startBtn?.addEventListener('click', () => renderCalculatorApp(container));
}

function renderCalculatorApp(container: HTMLElement) {
  container.innerHTML = `
    <div class="container">
      <div class="header">
        <h1>Voice Calculator</h1>
        <p>Speak naturally and let AI handle the math</p>
      </div>

      <div id="displaySection" class="display-section">
        <div id="transcript" class="transcript">Press "Start Listening" and speak your calculation</div>
        <div id="expression" class="expression"></div>
        <div id="result" class="result">—</div>
      </div>

      <div class="controls">
        <button id="listenBtn" class="btn btn-primary">
          <span class="btn-icon">🎤</span> Start Listening
        </button>
        <button id="clearBtn" class="btn btn-secondary">
          <span class="btn-icon">🗑️</span> Clear
        </button>
        <button id="speakBtn" class="btn btn-secondary">
          <span class="btn-icon">🔊</span> Speak
        </button>
        <button id="editBtn" class="btn btn-secondary">
          <span class="btn-icon">✏️</span> Edit
        </button>
      </div>

      <div id="status" class="status info">Ready to listen</div>

      <div class="history-section">
        <div class="history-header">
          <h2>Calculation History</h2>
          <button id="clearHistoryBtn" class="btn-clear">Clear All</button>
        </div>
        <div id="historyList" class="history-list">
          <div class="history-empty">No calculations yet. Start by speaking a calculation!</div>
        </div>
      </div>

      <div id="editorModal" class="editor-modal">
        <div class="editor-content">
          <div class="editor-header">
            <h3>Edit Expression</h3>
            <button id="editorCloseBtn" class="editor-close">&times;</button>
          </div>
          <input type="text" id="expressionInput" class="editor-input" placeholder="Enter mathematical expression..." />
          <div class="editor-footer">
            <button id="editorCancelBtn" class="btn btn-secondary">Cancel</button>
            <button id="editorSaveBtn" class="btn btn-primary">Calculate</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Instantiate the app only after the calculator UI exists
  new VoiceCalculatorApp();
}

document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  if (!app) return;
  renderLanding(app);
});
