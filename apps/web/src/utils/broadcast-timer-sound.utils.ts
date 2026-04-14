/**
 * Short chime when a broadcast acceptance timer ends (no external asset; Web Audio API).
 * May fail silently if the browser blocks audio until a user gesture (policy).
 */

export function playBroadcastTimerEndSound(): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.36);
    osc.onended = () => {
      void ctx.close();
    };
  } catch {
    // ignore (autoplay / AudioContext restrictions)
  }
}
