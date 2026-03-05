export function playCompletionSound() {
  try {
    const audio = new Audio('/complete.mp3');
    audio.play();
  } catch {}
}

export function playInProgressSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const t = ctx.currentTime;

    // Two soft sine tones — a gentle ascending chime
    [0, 0.09].forEach((delay, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(i === 0 ? 660 : 880, t + delay);
      gain.gain.setValueAtTime(0, t + delay);
      gain.gain.linearRampToValueAtTime(0.12, t + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.35);
      osc.start(t + delay);
      osc.stop(t + delay + 0.35);
      if (i === 1) osc.onended = () => ctx.close();
    });
  } catch {}
}
