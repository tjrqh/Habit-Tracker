let audioCtx: AudioContext | null = null;

const initAudioCtx = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  } catch (e) {
    console.warn("Web Audio Context initialization failed:", e);
  }
};

export const playSynthBeep = (freq: number, duration: number, type: OscillatorType = 'sine') => {
  try {
    initAudioCtx();
    if (!audioCtx) return;

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (err) {
    console.warn("Failed to play synth beep:", err);
  }
};

export const playSuccessSound = () => {
  try {
    initAudioCtx();
    const ctx = audioCtx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Bright C Major arpeggio)
    notes.forEach((freq, idx) => {
      try {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        const start = now + idx * 0.12;
        const duration = 0.6;
        gainNode.gain.setValueAtTime(0.1, start);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      } catch (innerErr) {
        console.warn(`Failed to play success note ${freq}:`, innerErr);
      }
    });
  } catch (err) {
    console.warn("Failed to play success sound:", err);
  }
};

export const playFailSound = () => {
  try {
    initAudioCtx();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(330, now);
    osc.frequency.linearRampToValueAtTime(165, now + 0.5);
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  } catch (err) {
    console.warn("Failed to play fail sound:", err);
  }
};
