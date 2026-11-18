// Synthesised sound only: every effect and the music loop are built with the
// Web Audio API at run time. No audio files, no network. Everything is guarded,
// so a browser without audio (or a headless screenshot run) just stays silent.

export function createAudio() {
  let context = null;
  let master = null;
  let musicTimer = 0;
  let musicStep = 0;
  let sirenNodes = null;
  let engineNodes = null;
  let musicOn = false;

  function ensure() {
    if (context) return context;
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      context = new Ctor();
      master = context.createGain();
      master.gain.value = 0.32;
      master.connect(context.destination);
    } catch {
      context = null;
    }
    return context;
  }

  function tone(freq, dur, type, vol, slideTo) {
    const ctx = ensure();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), ctx.currentTime + dur);
      gain.gain.setValueAtTime(vol || 0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(master);
      osc.start();
      osc.stop(ctx.currentTime + dur + 0.02);
    } catch {
      // Sound is garnish: never let it break the game.
    }
  }

  function noise(dur, vol, lowpass) {
    const ctx = ensure();
    if (!ctx) return;
    try {
      const length = Math.max(1, Math.floor(ctx.sampleRate * dur));
      const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = lowpass || 1200;
      const gain = ctx.createGain();
      gain.gain.value = vol || 0.3;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start();
    } catch {
      // Silent is fine.
    }
  }

  // A slow synthwave bass line: A minor, eight steps, one note a beat at 100 bpm.
  const BASS = [55, 0, 55, 65.41, 55, 0, 49, 58.27];
  const LEAD = [220, 261.63, 329.63, 261.63, 220, 196, 164.81, 196];

  function musicBeat(dt) {
    if (!musicOn) return;
    musicTimer -= dt;
    if (musicTimer > 0) return;
    musicTimer += 0.6;
    const step = musicStep % 8;
    musicStep += 1;
    if (BASS[step]) tone(BASS[step], 0.5, 'sawtooth', 0.10);
    if (step % 2 === 0) tone(LEAD[step], 0.28, 'triangle', 0.05);
    if (step % 4 === 0) noise(0.05, 0.08, 4000);
  }

  return {
    /** Call from any user gesture (start button, key press) to unlock audio. */
    unlock() {
      const ctx = ensure();
      if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    },
    startMusic() {
      musicOn = true;
      ensure();
    },
    stopMusic() {
      musicOn = false;
    },
    update(dt) {
      musicBeat(dt);
      if (engineNodes && context) {
        try {
          engineNodes.osc.frequency.value = 50 + Math.abs(engineNodes.speed) * 0.35;
          engineNodes.gain.gain.value = engineNodes.speed === 0 ? 0.0 : 0.05;
        } catch {
          // Ignore.
        }
      }
    },
    setEngine(speed) {
      const ctx = ensure();
      if (!ctx) return;
      try {
        if (!engineNodes) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.value = 60;
          gain.gain.value = 0;
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.value = 500;
          osc.connect(filter);
          filter.connect(gain);
          gain.connect(master);
          osc.start();
          engineNodes = { osc, gain, speed: 0 };
        }
        engineNodes.speed = speed;
      } catch {
        // Ignore.
      }
    },
    setSiren(on) {
      const ctx = ensure();
      if (!ctx) return;
      try {
        if (on && !sirenNodes) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const lfo = ctx.createOscillator();
          const lfoGain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 750;
          lfo.type = 'square';
          lfo.frequency.value = 0.9;
          lfoGain.gain.value = 220;
          lfo.connect(lfoGain);
          lfoGain.connect(osc.frequency);
          gain.gain.value = 0.045;
          osc.connect(gain);
          gain.connect(master);
          osc.start();
          lfo.start();
          sirenNodes = { osc, lfo, gain };
        } else if (!on && sirenNodes) {
          sirenNodes.osc.stop();
          sirenNodes.lfo.stop();
          sirenNodes = null;
        }
      } catch {
        // Ignore.
      }
    },
    shoot() {
      noise(0.12, 0.35, 2600);
      tone(180, 0.08, 'square', 0.12, 60);
    },
    punch() {
      noise(0.08, 0.25, 700);
    },
    crash() {
      noise(0.25, 0.4, 500);
      tone(90, 0.2, 'sawtooth', 0.18, 40);
    },
    pickup() {
      tone(660, 0.1, 'sine', 0.2);
      tone(990, 0.16, 'sine', 0.18);
    },
    cash() {
      tone(880, 0.08, 'triangle', 0.2);
      tone(1174, 0.08, 'triangle', 0.2);
      tone(1568, 0.18, 'triangle', 0.2);
    },
    steal() {
      tone(320, 0.12, 'square', 0.14, 520);
    },
    wanted() {
      tone(440, 0.14, 'square', 0.16);
      tone(415, 0.2, 'square', 0.16);
    },
    mission() {
      [523, 659, 784, 1046].forEach((freq, i) => {
        window.setTimeout(() => tone(freq, 0.22, 'triangle', 0.2), i * 110);
      });
    },
    fail() {
      [392, 330, 262, 196].forEach((freq, i) => {
        window.setTimeout(() => tone(freq, 0.25, 'sawtooth', 0.14), i * 140);
      });
    },
    click() {
      tone(700, 0.05, 'square', 0.1);
    },
  };
}
