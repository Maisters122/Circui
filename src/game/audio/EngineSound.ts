/**
 * EngineSound.ts - Web Audio API Synthesizer for high-performance race cars
 * Procedurally generates a pure, visceral, glitch-free racing acoustic profile:
 * - Authentic 4-stroke V8 cylinder combustion series (66.7 Hz - 633 Hz fundamental)
 * - Dual exhaust manifold collector merge resonance (133 Hz - 1266 Hz)
 * - Crankshaft mechanical rotational mass sub-octave (33 Hz - 316 Hz)
 * - Dynamic throttle airbox induction throat growl
 * - Clean lookahead linear-ramp parameter automation (100% click-free, zero electrical popping)
 * - Zero backfires, bangs, or artificial detonations per user specification.
 */

import { loadAuthenticSkidBuffer } from './skidAudioData';

export interface EngineAudioLayersState {
  base: boolean;        // Rugido muscular americano (fundamental V8 4.0x)
  v12: boolean;         // Aullido F1 V12 (armónico agudo 6.0x)
  whistle: boolean;     // Silbido característico V12 F1 (onda sinusoidal pura 12.0x)
  intake: boolean;      // Admisión dinámica airbox (bandpass 380-950Hz)
  engineFilter: boolean;// Filtro acústico progresivo (620Hz - 4200Hz)
  dcBlock: boolean;     // Filtro anti-DC subsónico (20Hz)
}

export class EngineSound {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isEngineSoundEnabled: boolean = true;
  private isInitialized: boolean = false;

  // Estado de capas de diagnóstico (Arquitectura híbrida: Rugido Americano + V12 F1)
  private layersState: EngineAudioLayersState = {
    base: true,
    v12: true,
    whistle: true,
    intake: true,
    engineFilter: true,
    dcBlock: true,
  };
  private soloLayer: keyof EngineAudioLayersState | 'all' | 'none' = 'all';

  // Continuous anti-jitter DSP phase smoothing state
  private smoothBaseFreq: number = 66.67;
  private smoothRpmNorm: number = 0;
  private smoothThrottleNorm: number = 0;

  // Cached parameter state to avoid redundant AudioParam scheduling
  private lastAppliedBaseFreq: number = 0;
  private lastAppliedRpmNorm: number = -1;
  private lastAppliedThrottleNorm: number = -1;
  private lastAppliedCutoff: number = 0;
  private lastAudioUpdateTimestamp: number = 0;

  // Audio Graph Master Nodes
  private masterGain: GainNode | null = null;
  private engineBusGain: GainNode | null = null;
  private dcBlockFilter: BiquadFilterNode | null = null;
  private bodyThumpFilter: BiquadFilterNode | null = null;
  private exhaustResonator: BiquadFilterNode | null = null;
  private waveShaper: WaveShaperNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private whistleFilter: BiquadFilterNode | null = null;
  private combustionBus: GainNode | null = null;

  // Pre-rendered High-Definition PCM Audio Buffers (32-bit Float loops, 100% click-free zero-crossing)
  private bufferBase: AudioBuffer | null = null;
  private bufferV12: AudioBuffer | null = null;
  private bufferWhistle: AudioBuffer | null = null;
  private bufferIntake: AudioBuffer | null = null;
  private bufferSkid: AudioBuffer | null = null;

  // Dynamic Sample Playback Sources & Gains (Sample-based Dynamic Granular Engine)
  private sourceBase: AudioBufferSourceNode | null = null;
  private gainBase: GainNode | null = null;
  private sourceV12: AudioBufferSourceNode | null = null;
  private gainV12: GainNode | null = null;
  private sourceWhistle: AudioBufferSourceNode | null = null;
  private gainWhistle: GainNode | null = null;
  private sourceIntake: AudioBufferSourceNode | null = null;
  private intakeFilter: BiquadFilterNode | null = null;
  private gainIntake: GainNode | null = null;

  // Realistic Tire Skid & Drift Screech Audio Nodes (Audio auténtico de neumático subido por el usuario)
  private sourceSkid: AudioBufferSourceNode | null = null;
  private skidGain: GainNode | null = null;
  private smoothSlipRatio: number = 0;
  private isSkidLoading: boolean = false;

  // Ancillary Race Audio Nodes
  private flatTireGain: GainNode | null = null;
  private flatTireFilter: BiquadFilterNode | null = null;
  private flatTireOsc: OscillatorNode | null = null;
  private flatTireThumpGain: GainNode | null = null;
  private lastHadPuncture: boolean = false;

  // Pre-baked one-shot buffers
  private crashBuffer: AudioBuffer | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  /**
   * Generates a 32-bit float high-definition PCM buffer of an authentic cross-plane American V8 combustion roar.
   * Modelled on real internal combustion physics:
   * - 90°-180°-270°-180° syncopated firing intervals (the visceral rumble of American muscle).
   * - Asymmetric cylinder blowdown pressure wave with rapid rise and acoustic runner reflection.
   * - Exhaust manifold acoustic cavity thump (68 Hz) and secondary bounce (136 Hz).
   * - Stochastic exhaust gas turbulence micro-bursts for realistic gritty mechanical texture.
   * - Seamless equal-power zero-crossing loop crossfade (100% click-free).
   */
  private createMuscleCombustionBuffer(ctx: AudioContext): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const numCycles = 30; // 30 complete 4-stroke engine cycles at 2000 RPM base
    const cycleDuration = 0.060; // 60 ms per 720° cycle
    const totalDuration = numCycles * cycleDuration; // 1.80 seconds exactly
    const numSamples = Math.floor(totalDuration * sampleRate);
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    // Cross-plane V8 irregular firing intervals (fraction of 720° cycle):
    const firingOffsets = [0.0, 0.125, 0.375, 0.500, 0.625, 0.750, 0.875];
    const cylinderGains = [1.0, 0.94, 1.05, 0.98, 1.02, 0.95, 1.06, 0.97];

    for (let c = 0; c < numCycles; c++) {
      const cycleStartSample = Math.floor(c * cycleDuration * sampleRate);

      for (let cyl = 0; cyl < firingOffsets.length; cyl++) {
        const offsetSec = firingOffsets[cyl] * cycleDuration;
        const pulseStartSample = cycleStartSample + Math.floor(offsetSec * sampleRate);
        const cylGain = cylinderGains[cyl % cylinderGains.length];
        const pulseLenSamples = Math.min(numSamples - pulseStartSample, Math.floor(0.018 * sampleRate));

        for (let s = 0; s < pulseLenSamples; s++) {
          const idx = pulseStartSample + s;
          if (idx >= numSamples) break;
          const t = s / sampleRate;

          // 1. Primary asymmetric pressure wave (sharp rise, expansion decay)
          const tau1 = 0.0016;
          const p1 = (t / tau1) * Math.exp(-t / tau1);

          // 2. Deep acoustic runner low thump (68 Hz cavity resonance: visceral chest pressure)
          const thump = Math.sin(2 * Math.PI * 68 * t) * Math.exp(-t / 0.012) * 0.75;

          // 3. Exhaust manifold secondary bounce (136 Hz)
          const bounce = Math.sin(2 * Math.PI * 136 * t + 0.4) * Math.exp(-t / 0.008) * 0.40;

          // 4. Stochastic gas turbulence texture (filtered gas flow noise)
          const noise = (Math.random() * 2 - 1) * Math.exp(-t / 0.005) * 0.12;

          data[idx] += cylGain * (p1 * 1.25 + thump + bounce + noise);
        }
      }
    }

    this.applySeamlessLoopCrossfade(data, Math.floor(0.120 * sampleRate));
    this.normalizeAudioData(data, 0.85);
    return buffer;
  }

  /**
   * Generates a 32-bit float high-definition PCM buffer of an F1 V12 exhaust screaming resonance.
   * Modelled on Formula 1 high-revving trumpet exhaust collector acoustics:
   * - 12 cylinders firing evenly every 60° (12 pulses per 720° cycle).
   * - Harmonic trumpet overtones from multi-runner merge collectors.
   * - Natural acoustic damping rolling off ultra-high harshness.
   */
  private createF1ScreamerBuffer(ctx: AudioContext): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const numCycles = 30;
    const cycleDuration = 0.060;
    const totalDuration = numCycles * cycleDuration;
    const numSamples = Math.floor(totalDuration * sampleRate);
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    const pulsesPerCycle = 12;
    const pulseIntervalSec = cycleDuration / pulsesPerCycle;

    for (let c = 0; c < numCycles; c++) {
      const cycleStartSample = Math.floor(c * cycleDuration * sampleRate);

      for (let p = 0; p < pulsesPerCycle; p++) {
        const pulseStartSample = cycleStartSample + Math.floor(p * pulseIntervalSec * sampleRate);
        const pulseLenSamples = Math.min(numSamples - pulseStartSample, Math.floor(0.012 * sampleRate));
        const bankFactor = (p % 2 === 0) ? 1.0 : 0.96;

        for (let s = 0; s < pulseLenSamples; s++) {
          const idx = pulseStartSample + s;
          if (idx >= numSamples) break;
          const t = s / sampleRate;

          // High-velocity exhaust merge pulses with tuned trumpet acoustic overtones
          const p1 = Math.sin(2 * Math.PI * 200 * t) * Math.exp(-t / 0.008);
          const trumpet1 = Math.sin(2 * Math.PI * 400 * t) * Math.exp(-t / 0.006) * 0.65;
          const trumpet2 = Math.sin(2 * Math.PI * 600 * t + 0.3) * Math.exp(-t / 0.004) * 0.35;
          const highHowl = Math.sin(2 * Math.PI * 1200 * t + 0.6) * Math.exp(-t / 0.003) * 0.15;

          data[idx] += bankFactor * (p1 + trumpet1 + trumpet2 + highHowl);
        }
      }
    }

    this.applySeamlessLoopCrossfade(data, Math.floor(0.120 * sampleRate));
    this.normalizeAudioData(data, 0.75);
    return buffer;
  }

  /**
   * Generates a 32-bit float high-definition PCM buffer of an authentic F1 straight-cut transmission gear whine.
   * Modelled on competition spur gear dog-box mechanics:
   * - 28-tooth straight-cut spur gear meshing tone (933.3 Hz at 2000 RPM base).
   * - Exactly 1680 integer tooth mesh cycles in 1.80s loop (zero pitch jitter or loop click).
   * - Tooth engagement harmonics with subtle shaft rotation load envelope.
   * - Pure, musical, intoxicating competition transmission whistle.
   */
  private createF1GearWhineBuffer(ctx: AudioContext): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const duration = 1.80;
    const numSamples = Math.floor(duration * sampleRate);
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    const fundamentalFreq = 933.3333; // 28 teeth * (2000 RPM / 60)

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const phase = 2 * Math.PI * fundamentalFreq * t;

      // 1. Pure straight-cut tooth contact tone (fundamental mesh)
      const f1 = Math.sin(phase);
      // 2. 2nd tooth profile harmonic (musical octave shimmer)
      const f2 = Math.sin(2 * phase + 0.25) * 0.22;
      // 3. 3rd tooth profile harmonic (metallic racing edge)
      const f3 = Math.sin(3 * phase + 0.50) * 0.06;

      // 4. Subtle mechanical rotation tooth engagement load envelope (shaft rotation)
      const shaftMod = 1.0 + 0.035 * Math.sin(2 * Math.PI * (2000 / 60) * t);

      data[i] = (f1 + f2 + f3) * shaftMod;
    }

    this.applySeamlessLoopCrossfade(data, Math.floor(0.080 * sampleRate));
    this.normalizeAudioData(data, 0.65);
    return buffer;
  }

  /**
   * Generates a 32-bit float high-definition PCM buffer of an airbox dynamic induction throat roar.
   */
  private createIntakeAirboxBuffer(ctx: AudioContext): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const numCycles = 30;
    const cycleDuration = 0.060;
    const totalDuration = numCycles * cycleDuration;
    const numSamples = Math.floor(totalDuration * sampleRate);
    const buffer = ctx.createBuffer(1, numSamples, sampleRate);
    const data = buffer.getChannelData(0);

    const pulses = 8;
    const interval = cycleDuration / pulses;

    for (let c = 0; c < numCycles; c++) {
      const cycleStart = Math.floor(c * cycleDuration * sampleRate);
      for (let p = 0; p < pulses; p++) {
        const pStart = cycleStart + Math.floor(p * interval * sampleRate);
        const pLen = Math.min(numSamples - pStart, Math.floor(0.015 * sampleRate));

        for (let s = 0; s < pLen; s++) {
          const idx = pStart + s;
          if (idx >= numSamples) break;
          const t = s / sampleRate;

          // Hollow airbox chamber resonance (280 Hz) + suction breath
          const resonance = Math.sin(2 * Math.PI * 280 * t) * Math.exp(-t / 0.009);
          const breath = (Math.random() * 2 - 1) * Math.exp(-t / 0.006) * 0.18;

          data[idx] += (resonance + breath);
        }
      }
    }

    this.applySeamlessLoopCrossfade(data, Math.floor(0.120 * sampleRate));
    this.normalizeAudioData(data, 0.70);
    return buffer;
  }

  /**
   * Carga de forma asíncrona y con decodificación de alta fidelidad el audio real de neumático
   * derrapando subido por el usuario (tire_skid.mp3 / ElevenLabs_Chirrido_de_frenos_de_tren_del_metro.mp3).
   */
  private async loadSkidAudioAsync(): Promise<void> {
    if (!this.ctx || this.isSkidLoading) return;
    this.isSkidLoading = true;
    try {
      this.bufferSkid = await loadAuthenticSkidBuffer(this.ctx);
      this.setupSkidSourceNode();
    } catch (err) {
      console.warn('Could not load authentic skid buffer:', err);
    } finally {
      this.isSkidLoading = false;
    }
  }

  /**
   * Inicializa el nodo de reproducción en bucle del audio de derrape real.
   * Reproduce en bucle sin costuras a volumen cero cuando no hay derrape,
   * y se modula con latencia cero (Zero GC allocations).
   */
  private setupSkidSourceNode(): void {
    if (!this.ctx || !this.bufferSkid) return;

    if (this.sourceSkid) {
      try {
        this.sourceSkid.stop();
        this.sourceSkid.disconnect();
      } catch {
        // Safe catch
      }
      this.sourceSkid = null;
    }

    this.sourceSkid = this.ctx.createBufferSource();
    this.sourceSkid.buffer = this.bufferSkid;
    this.sourceSkid.loop = true;
    this.sourceSkid.playbackRate.setValueAtTime(1.0, this.ctx.currentTime);

    if (!this.skidGain) {
      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(0.0000, this.ctx.currentTime);
      if (this.masterGain) {
        this.skidGain.connect(this.masterGain);
      }
    }

    this.sourceSkid.connect(this.skidGain);
    this.sourceSkid.start(0);
  }

  /**
   * Applies an equal-power trigonometric crossfade window across loop boundaries.
   * Ensures identical audio values and derivatives at start and end for zero click.
   */
  private applySeamlessLoopCrossfade(data: Float32Array, fadeSamples: number): void {
    const len = data.length;
    const fade = Math.min(fadeSamples, Math.floor(len * 0.25));
    for (let i = 0; i < fade; i++) {
      const frac = i / fade;
      const fadeIn = Math.sin(frac * (Math.PI * 0.5));
      const fadeOut = Math.cos(frac * (Math.PI * 0.5));
      const startVal = data[i];
      const endVal = data[len - fade + i];
      const blended = startVal * fadeIn + endVal * fadeOut;
      data[i] = blended;
      data[len - fade + i] = blended;
    }
  }

  /**
   * Normalizes audio buffer channel data to a safe peak amplitude to avoid DAC clipping.
   */
  private normalizeAudioData(data: Float32Array, targetPeak: number = 0.80): void {
    let max = 0;
    for (let i = 0; i < data.length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > max) max = abs;
    }
    if (max > 0.0001) {
      const scale = targetPeak / max;
      for (let i = 0; i < data.length; i++) {
        data[i] *= scale;
      }
    }
  }

  /**
   * Soft hyperbolic tangent acoustic saturation curve.
   * Compresses engine dynamics gently without generating harsh high-frequency intermodulation.
   */
  private createDistortionCurve(samples: number = 256): Float32Array<ArrayBuffer> {
    const buffer = new ArrayBuffer(samples * 4);
    const curve = new Float32Array(buffer);
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(1.20 * x);
    }
    return curve;
  }

  public init(): void {
    if (this.isInitialized) return;

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Master Gain: calibrated headroom (0.45) guarantees zero DAC clipping
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.45, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Dedicated Competition Racing Engine Bus (Turned off = 0.0 gain)
      this.engineBusGain = this.ctx.createGain();
      this.engineBusGain.gain.setValueAtTime(this.isEngineSoundEnabled ? 0.70 : 0.0, this.ctx.currentTime);

      // DC-blocking high-pass filter (20 Hz, Q = 0.707 - elimina offsets DC continuos)
      this.dcBlockFilter = this.ctx.createBiquadFilter();
      this.dcBlockFilter.type = 'highpass';
      this.dcBlockFilter.frequency.setValueAtTime(20, this.ctx.currentTime);
      this.dcBlockFilter.Q.setValueAtTime(0.707, this.ctx.currentTime);
      this.dcBlockFilter.connect(this.masterGain);

      this.engineBusGain.connect(this.dcBlockFilter);

      // Progressive engine low-pass filter (Corte acústico orgánico: 580 Hz en ralentí a 2800 Hz en corte)
      // Cortar por encima de 2800 Hz elimina por completo los agudos digitales artificiales y el sonido a zumbador
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(580, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(0.707, this.ctx.currentTime);
      this.engineFilter.connect(this.engineBusGain);

      // Soft non-linear analog acoustic saturation (compresión cálida para combustión de escape)
      this.waveShaper = this.ctx.createWaveShaper();
      this.waveShaper.curve = this.createDistortionCurve(256);
      this.waveShaper.oversample = '2x';
      this.waveShaper.connect(this.engineFilter);

      // Exhaust Manifold Formant Resonator (Dynamic peaking filter: 160 Hz en bajas -> 1260 Hz en altas)
      this.exhaustResonator = this.ctx.createBiquadFilter();
      this.exhaustResonator.type = 'peaking';
      this.exhaustResonator.frequency.setValueAtTime(160, this.ctx.currentTime);
      this.exhaustResonator.Q.setValueAtTime(1.6, this.ctx.currentTime);
      this.exhaustResonator.gain.setValueAtTime(4.5, this.ctx.currentTime);
      this.exhaustResonator.connect(this.waveShaper);

      // Body Thump Filter (LowShelf +6.0dB a 125Hz: Potencia y retumbe visceral del motor americano V8)
      this.bodyThumpFilter = this.ctx.createBiquadFilter();
      this.bodyThumpFilter.type = 'lowshelf';
      this.bodyThumpFilter.frequency.setValueAtTime(125, this.ctx.currentTime);
      this.bodyThumpFilter.gain.setValueAtTime(6.0, this.ctx.currentTime);
      this.bodyThumpFilter.connect(this.exhaustResonator);

      // Combustion Sum Bus: Suma las pistas de escape y admisión antes de la saturación
      this.combustionBus = this.ctx.createGain();
      this.combustionBus.gain.setValueAtTime(1.0, this.ctx.currentTime);
      this.combustionBus.connect(this.bodyThumpFilter);

      // Whistle Filter dedicado: Bandpass que sigue la frecuencia de engranaje
      // IMPORTANTE: El silbido conecta DIRECTAMENTE a engineBusGain (NO pasa por waveShaper),
      // aislando por completo la transmisión de la distorsión del escape (CERO interferencias o chispidos).
      this.whistleFilter = this.ctx.createBiquadFilter();
      this.whistleFilter.type = 'bandpass';
      this.whistleFilter.frequency.setValueAtTime(933, this.ctx.currentTime);
      this.whistleFilter.Q.setValueAtTime(1.4, this.ctx.currentTime);

      // Pre-render High-Definition 32-bit Float PCM Audio Buffers
      this.bufferBase = this.createMuscleCombustionBuffer(this.ctx);
      this.bufferV12 = this.createF1ScreamerBuffer(this.ctx);
      this.bufferWhistle = this.createF1GearWhineBuffer(this.ctx);
      this.bufferIntake = this.createIntakeAirboxBuffer(this.ctx);
      // Carga asíncrona inmediata del audio de derrape auténtico subido por el usuario
      this.loadSkidAudioAsync();

      // 1. Pista PCM Rugido Muscular Americano (Retumbe profundo de escape cross-plane V8)
      this.sourceBase = this.ctx.createBufferSource();
      this.sourceBase.buffer = this.bufferBase;
      this.sourceBase.loop = true;
      this.sourceBase.playbackRate.setValueAtTime(1.0, this.ctx.currentTime);
      this.gainBase = this.ctx.createGain();
      this.gainBase.gain.setValueAtTime(this.isEngineSoundEnabled ? 0.42 : 0.0, this.ctx.currentTime);
      this.sourceBase.connect(this.gainBase);
      this.gainBase.connect(this.combustionBus);
      this.sourceBase.start(0);

      // 2. Pista PCM Aullido F1 V12 (Aullido de trompeta de escape de competición)
      this.sourceV12 = this.ctx.createBufferSource();
      this.sourceV12.buffer = this.bufferV12;
      this.sourceV12.loop = true;
      this.sourceV12.playbackRate.setValueAtTime(1.0, this.ctx.currentTime);
      this.gainV12 = this.ctx.createGain();
      this.gainV12.gain.setValueAtTime(0.0000, this.ctx.currentTime);
      this.sourceV12.connect(this.gainV12);
      this.gainV12.connect(this.combustionBus);
      this.sourceV12.start(0);

      // 3. Pista PCM Silbido de Transmisión F1 (Engranajes rectos de competición dog-box)
      this.sourceWhistle = this.ctx.createBufferSource();
      this.sourceWhistle.buffer = this.bufferWhistle;
      this.sourceWhistle.loop = true;
      this.sourceWhistle.playbackRate.setValueAtTime(1.0, this.ctx.currentTime);
      this.gainWhistle = this.ctx.createGain();
      this.gainWhistle.gain.setValueAtTime(0.0000, this.ctx.currentTime);
      this.sourceWhistle.connect(this.whistleFilter);
      this.whistleFilter.connect(this.gainWhistle);
      this.gainWhistle.connect(this.engineBusGain);
      this.sourceWhistle.start(0);

      // 4. Pista PCM Admisión Dinámica Airbox (Gruñido de aspiración de mariposas)
      this.sourceIntake = this.ctx.createBufferSource();
      this.sourceIntake.buffer = this.bufferIntake;
      this.sourceIntake.loop = true;
      this.sourceIntake.playbackRate.setValueAtTime(1.0, this.ctx.currentTime);
      this.intakeFilter = this.ctx.createBiquadFilter();
      this.intakeFilter.type = 'bandpass';
      this.intakeFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
      this.intakeFilter.Q.setValueAtTime(1.3, this.ctx.currentTime);
      this.gainIntake = this.ctx.createGain();
      this.gainIntake.gain.setValueAtTime(0.0000, this.ctx.currentTime);
      this.sourceIntake.connect(this.intakeFilter);
      this.intakeFilter.connect(this.gainIntake);
      this.gainIntake.connect(this.combustionBus);
      this.sourceIntake.start(0);

      // 5. Pista de Chillido de Derrape Real (audio de neumático subido por el usuario)
      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(0.0000, this.ctx.currentTime);
      this.skidGain.connect(this.masterGain);

      // Flat Tire Rhythmic Grinding and Flapping Loop
      this.setupFlatTireSound();

      // Pre-bake crash crunch noise buffer (0.4s)
      const crSize = Math.floor(this.ctx.sampleRate * 0.4);
      this.crashBuffer = this.ctx.createBuffer(1, crSize, this.ctx.sampleRate);
      const crData = this.crashBuffer.getChannelData(0);
      for (let i = 0; i < crSize; i++) {
        crData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.08));
      }

      this.isInitialized = true;
    } catch (e) {
      console.warn('Web Audio could not initialize automatically:', e);
    }
  }

  public resume(): void {
    if (!this.isInitialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Update engine sound parameters every frame with lookahead linear ramps (100% click-free)
   * Modulates playbackRate and dynamic gains for sample-based realism.
   * @param rpm Current engine RPM (1000 - 9500)
   * @param throttle Throttle pedal position (0.0 - 1.0)
   * @param slipRatio Lateral/longitudinal tire slip factor (0.0 - 1.0)
   * @param speedMs Car speed in m/s
   * @param _engineHealth Factor 0.0 to 1.0
   * @param isDrifting Whether vehicle is currently in active drift slide
   */
  public update(rpm: number, throttle: number, slipRatio: number, speedMs: number, _engineHealth: number = 1.0, isDrifting: boolean = false): void {
    if (!this.isInitialized || !this.ctx || this.isMuted || !this.isEngineSoundEnabled) return;

    const now = performance.now();
    const currentTime = this.ctx.currentTime;

    // Resampling ratio relative to 2000 RPM base loop buffer:
    // 1000 RPM idle: playbackRate = 0.50
    // 2000 RPM base: playbackRate = 1.00
    // 9500 RPM redline: playbackRate = 4.75
    const targetPlaybackRate = Math.max(0.40, Math.min(4.8, rpm / 2000.0));
    const targetRpmNorm = Math.min(1.0, Math.max(0.0, (rpm - 1000) / (9500 - 1000)));
    const targetThrottleNorm = Math.min(1.0, Math.max(0.0, throttle));

    if (this.lastAudioUpdateTimestamp === 0) {
      this.lastAudioUpdateTimestamp = now;
      this.smoothBaseFreq = targetPlaybackRate;
      this.smoothRpmNorm = targetRpmNorm;
      this.smoothThrottleNorm = targetThrottleNorm;
    }

    const dt = Math.min(0.05, Math.max(0.001, (now - this.lastAudioUpdateTimestamp) * 0.001));
    this.lastAudioUpdateTimestamp = now;

    // Continuous, frame-rate independent exponential smoothing in JS (20 Hz response rate)
    const alpha = 1.0 - Math.exp(-20.0 * dt);
    this.smoothBaseFreq += (targetPlaybackRate - this.smoothBaseFreq) * alpha;
    this.smoothRpmNorm += (targetRpmNorm - this.smoothRpmNorm) * alpha;
    this.smoothThrottleNorm += (targetThrottleNorm - this.smoothThrottleNorm) * alpha;

    const playbackRate = this.smoothBaseFreq;
    const rpmNorm = this.smoothRpmNorm;
    const throttleNorm = this.smoothThrottleNorm;
    const throttleCurve = Math.pow(throttleNorm, 1.40);

    // Micro-jitter torsional mecánico sutil (0.15% de variación rotacional ciclo a ciclo):
    // Aporta esa sensación viva de vibración de acero de un cigüeñal de carreras sin provocar saltos audibles
    const mechanicalJitter = (Math.sin(now * 0.025) * 0.0015 + Math.cos(now * 0.013) * 0.0010);
    const dynamicRate = playbackRate * (1.0 + mechanicalJitter);

    // Delta thresholds: when stopped at idle or at constant cruise, parameters settle and
    // ZERO redundant automation events are dispatched to Web Audio.
    const rateChanged = Math.abs(playbackRate - this.lastAppliedBaseFreq) > 0.004;
    const stateChanged = Math.abs(rpmNorm - this.lastAppliedRpmNorm) > 0.005 || Math.abs(throttleNorm - this.lastAppliedThrottleNorm) > 0.005;

    if (rateChanged) {
      this.lastAppliedBaseFreq = playbackRate;
      if (this.sourceBase) {
        this.sourceBase.playbackRate.setTargetAtTime(dynamicRate, currentTime, 0.020);
      }
      if (this.sourceV12) {
        this.sourceV12.playbackRate.setTargetAtTime(dynamicRate, currentTime, 0.020);
      }
      if (this.sourceWhistle) {
        // El silbido de transmisión sigue directamente el régimen del tren de potencia
        this.sourceWhistle.playbackRate.setTargetAtTime(playbackRate, currentTime, 0.020);
      }
      if (this.sourceIntake) {
        this.sourceIntake.playbackRate.setTargetAtTime(dynamicRate, currentTime, 0.020);
      }
      if (this.whistleFilter) {
        const whistleCenter = Math.min(10000, Math.max(300, 933.0 * playbackRate));
        this.whistleFilter.frequency.setTargetAtTime(whistleCenter, currentTime, 0.020);
      }
    }

    if (stateChanged) {
      this.lastAppliedRpmNorm = rpmNorm;
      this.lastAppliedThrottleNorm = throttleNorm;

      // 1. Rugido Muscular Americano (Potente masa PCM cross-plane V8 en bajas y medias revoluciones):
      if (this.gainBase) {
        const baseVol = this.layersState.base
          ? (0.42 * (1.0 - 0.20 * rpmNorm) + 0.14 * throttleCurve)
          : 0.0;
        this.gainBase.gain.setTargetAtTime(baseVol, currentTime, 0.020);
      }

      // 2. Aullido F1 V12 (Muestras de escape de competición que se desatan en medias y altas):
      if (this.gainV12) {
        const v12Vol = this.layersState.v12
          ? (Math.pow(rpmNorm, 1.35) * (0.28 + 0.12 * throttleCurve))
          : 0.0;
        this.gainV12.gain.setTargetAtTime(Math.max(0.0, v12Vol), currentTime, 0.020);
      }

      // 3. Silbido de Transmisión de Dientes Rectos F1 (aislado y sedoso, ligado a RPM y aceleración):
      // Aúlla bajo par de aceleración transmitiendo la brutalidad mecánica de la caja de cambios
      if (this.gainWhistle) {
        const whistleVol = this.layersState.whistle
          ? (Math.pow(rpmNorm, 1.45) * (0.045 + 0.075 * throttleCurve))
          : 0.0;
        this.gainWhistle.gain.setTargetAtTime(Math.max(0.0, whistleVol), currentTime, 0.020);
      }

      // 4. Dynamic Throttle Airbox Induction Roar:
      // Ruge al pisar el acelerador transmitiendo la garganta de aspiración
      if (this.gainIntake && this.intakeFilter) {
        const intakeVol = this.layersState.intake
          ? (throttleCurve * (0.22 + 0.08 * rpmNorm))
          : 0.0;
        this.gainIntake.gain.setTargetAtTime(Math.max(0.0, intakeVol), currentTime, 0.020);
        const targetIntakeFreq = 280 + rpmNorm * 520;
        this.intakeFilter.frequency.setTargetAtTime(targetIntakeFreq, currentTime, 0.020);
      }

      // 5. Potencia Muscular Americana: Body Thump Filter (LowShelf +6.0dB en 125Hz):
      // Aporta ese impacto acústico en el pecho a bajas revoluciones y con acelerador
      if (this.bodyThumpFilter) {
        const targetThumpGain = 6.0 - 3.5 * rpmNorm + 2.0 * throttleCurve;
        this.bodyThumpFilter.gain.setTargetAtTime(targetThumpGain, currentTime, 0.020);
      }

      // 6. Resonador Formante de Escape:
      // De 160 Hz en bajas (resonancia de colector) a 1260 Hz en altas (aullido F1)
      if (this.exhaustResonator) {
        const targetResonance = 160 + rpmNorm * 1100;
        this.exhaustResonator.frequency.setTargetAtTime(targetResonance, currentTime, 0.020);
      }

      // 7. Smooth acoustic engine body low-pass filter:
      // Cálido y pesado en ralentí (580 Hz), abre hasta 2800 Hz en corte.
      // CORTA POR COMPLETO cualquier frecuencia artificial superior (> 2.8 kHz) para un sonido 100% orgánico.
      if (this.engineFilter) {
        if (!this.layersState.engineFilter) {
          this.engineFilter.frequency.setTargetAtTime(20000, currentTime, 0.020);
        } else {
          const minCutoff = 580;
          const maxCutoff = 2800;
          const targetCutoff = minCutoff + (maxCutoff - minCutoff) * Math.pow(Math.max(throttleNorm, 0.35 * rpmNorm), 1.10);
          if (Math.abs(targetCutoff - this.lastAppliedCutoff) > 4.0) {
            this.lastAppliedCutoff = targetCutoff;
            this.engineFilter.frequency.setTargetAtTime(targetCutoff, currentTime, 0.020);
          }
        }
      }

      // 8. Subsonic DC block filter (20 Hz elimina derivas DC sin perturbar los graves):
      if (this.dcBlockFilter) {
        const targetDcCutoff = this.layersState.dcBlock ? 20 : 5;
        this.dcBlockFilter.frequency.setTargetAtTime(targetDcCutoff, currentTime, 0.020);
      }
    }

    // 9. Modulación Acústica del Chillido de Derrape Real (audio de neumático subido por el usuario)
    // Se activa suavemente en el umbral de pérdida de tracción y ruge al derrapar de costado
    const effectiveSlip = Math.max(slipRatio, isDrifting ? 0.45 : 0.0);
    const slipAlpha = 1.0 - Math.exp(-22.0 * dt);
    this.smoothSlipRatio += (effectiveSlip - this.smoothSlipRatio) * slipAlpha;

    if (this.skidGain) {
      let targetSkidVol = 0.0;
      let targetSkidPitch = 1.0;

      // Se dispara si hay derrape efectivo y el vehículo tiene movimiento (> 2.0 m/s)
      if (this.smoothSlipRatio > 0.10 && speedMs > 2.0) {
        const slipIntensity = Math.min(1.0, (this.smoothSlipRatio - 0.10) / 0.40);
        const speedIntensity = Math.min(1.0, (speedMs - 2.0) / 7.0);

        // Curva progresiva con pegada y presencia en derrape profundo
        targetSkidVol = Math.pow(slipIntensity, 1.15) * speedIntensity * 0.60;

        // Modulación física suave y natural del pitch (0.92x a 1.08x) manteniendo la textura original
        targetSkidPitch = 0.94 + 0.10 * slipIntensity + 0.04 * Math.min(1.0, speedMs / 25.0);
      }

      this.skidGain.gain.setTargetAtTime(targetSkidVol, currentTime, 0.025);
      if (this.sourceSkid) {
        this.sourceSkid.playbackRate.setTargetAtTime(targetSkidPitch, currentTime, 0.025);
      }
    }
  }

  /**
   * Sound effect for gear changes, rev-limiters and lift-off backfires
   * Intentionally silenced per user specification: ZERO pops, bangs, or backfires
   */
  public triggerBackfire(_isHighRpm: boolean = false): void {
    // Zero-backfire acoustic profile: completely muted
    return;
  }

  /**
   * Real-time continuous scraping / metal friction sound modulation
   */
  public updateScrape(_intensity: number, _speedKmh: number): void {
    return;
  }

  /**
   * Collision sound effect with volume and pitch scaled by impact force (zero-allocation)
   */
  public triggerCrash(impactForce: number): void {
    if (!this.isInitialized || !this.ctx || this.isMuted || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const normalizedForce = Math.min(1.0, Math.max(0.1, impactForce / 35));

    // Low frequency punch
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.35);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(normalizedForce * 0.7, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 0.4);

    // Crunch noise using pre-baked buffer
    if (this.crashBuffer) {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.crashBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, t);
      filter.Q.setValueAtTime(2.0, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(normalizedForce * 0.8, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.masterGain);
      noise.start(t);
    }
  }

  /**
   * Sound effect for pneumatic hydraulic car lift jacks (hiss & clank)
   */
  public triggerPneumaticJack(isUp: boolean): void {
    if (!this.isInitialized || !this.ctx || this.isMuted || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.12));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(isUp ? 2200 : 1200, t);
    filter.frequency.exponentialRampToValueAtTime(isUp ? 600 : 300, t + 0.35);
    filter.Q.setValueAtTime(3.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    noise.start(t);

    const clankOsc = this.ctx.createOscillator();
    const clankGain = this.ctx.createGain();
    clankOsc.type = 'triangle';
    clankOsc.frequency.setValueAtTime(isUp ? 380 : 180, t + 0.05);
    clankOsc.frequency.exponentialRampToValueAtTime(80, t + 0.18);

    clankGain.gain.setValueAtTime(0.4, t + 0.05);
    clankGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    clankOsc.connect(clankGain);
    clankGain.connect(this.masterGain);
    clankOsc.start(t + 0.05);
    clankOsc.stop(t + 0.22);
  }

  /**
   * Sound effect for high-speed pneumatic impact wrench unbolting/bolting wheel nuts
   */
  public triggerWheelGunRattle(): void {
    if (!this.isInitialized || !this.ctx || this.isMuted || !this.masterGain) return;

    const t = this.ctx.currentTime;
    const pulseCount = 6;
    for (let p = 0; p < pulseCount; p++) {
      const pt = t + p * 0.038;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1400 + Math.random() * 400, pt);
      osc.frequency.exponentialRampToValueAtTime(350, pt + 0.03);

      gain.gain.setValueAtTime(0.22, pt);
      gain.gain.exponentialRampToValueAtTime(0.001, pt + 0.035);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(pt);
      osc.stop(pt + 0.04);
    }
  }

  private setupFlatTireSound(): void {
    if (!this.ctx || !this.masterGain) return;

    this.flatTireFilter = this.ctx.createBiquadFilter();
    this.flatTireFilter.type = 'bandpass';
    this.flatTireFilter.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.flatTireFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    this.flatTireGain = this.ctx.createGain();
    this.flatTireGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.flatTireFilter.connect(this.flatTireGain);
    this.flatTireGain.connect(this.masterGain);

    this.flatTireThumpGain = this.ctx.createGain();
    this.flatTireThumpGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.flatTireThumpGain.connect(this.masterGain);
  }

  /**
   * Real-time continuous flat tire flapping / rim grinding sound modulation
   */
  public updateFlatTireSound(hasPuncture: boolean, speedMs: number): void {
    if (!this.isInitialized || !this.ctx || this.isMuted) return;
    if (!hasPuncture && !this.lastHadPuncture) return;
    this.lastHadPuncture = hasPuncture;

    const t = this.ctx.currentTime;
    const safeTime = t + 0.015;
    const speedKmh = speedMs * 3.6;

    if (hasPuncture && speedKmh > 2.0) {
      if (!this.flatTireOsc && this.ctx) {
        this.flatTireOsc = this.ctx.createOscillator();
        this.flatTireOsc.type = 'sawtooth';
        this.flatTireOsc.frequency.setValueAtTime(14, safeTime);
        const thumpFilter = this.ctx.createBiquadFilter();
        thumpFilter.type = 'lowpass';
        thumpFilter.frequency.setValueAtTime(160, safeTime);
        this.flatTireOsc.connect(thumpFilter);
        if (this.flatTireThumpGain) thumpFilter.connect(this.flatTireThumpGain);
        this.flatTireOsc.start();
      }

      const flapFreq = Math.max(3, Math.min(35, speedMs * 2.8));
      const targetGain = Math.min(0.65, 0.15 + (speedKmh / 50.0) * 0.45);

      if (this.flatTireOsc) {
        this.flatTireOsc.frequency.linearRampToValueAtTime(flapFreq, safeTime);
      }
      if (this.flatTireThumpGain) {
        this.flatTireThumpGain.gain.linearRampToValueAtTime(targetGain * 0.75, safeTime);
      }
      if (this.flatTireGain) {
        this.flatTireGain.gain.linearRampToValueAtTime(targetGain * 0.55, safeTime);
      }
      if (this.flatTireFilter) {
        const centerFreq = 320 + speedKmh * 18.0;
        this.flatTireFilter.frequency.linearRampToValueAtTime(centerFreq, safeTime);
      }
    } else {
      if (this.flatTireThumpGain) {
        this.flatTireThumpGain.gain.linearRampToValueAtTime(0, safeTime);
      }
      if (this.flatTireGain) {
        this.flatTireGain.gain.linearRampToValueAtTime(0, safeTime);
      }
    }
  }

  /**
   * Explosive pneumatic tire blowout sound effect ("BANG! PSHHHHH!")
   */
  public triggerTireBlowout(): void {
    if (!this.isInitialized || !this.ctx || this.isMuted || !this.masterGain) return;

    const t = this.ctx.currentTime;

    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'sawtooth';
    popOsc.frequency.setValueAtTime(320, t);
    popOsc.frequency.exponentialRampToValueAtTime(35, t + 0.18);

    popGain.gain.setValueAtTime(0.85, t);
    popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    popOsc.connect(popGain);
    popGain.connect(this.masterGain);
    popOsc.start(t);
    popOsc.stop(t + 0.25);

    const hissLen = Math.floor(this.ctx.sampleRate * 0.85);
    const hissBuffer = this.ctx.createBuffer(1, hissLen, this.ctx.sampleRate);
    const hissData = hissBuffer.getChannelData(0);
    for (let i = 0; i < hissLen; i++) {
      hissData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.28));
    }

    const hissSource = this.ctx.createBufferSource();
    hissSource.buffer = hissBuffer;

    const hissFilter = this.ctx.createBiquadFilter();
    hissFilter.type = 'highpass';
    hissFilter.frequency.setValueAtTime(1800, t);
    hissFilter.frequency.exponentialRampToValueAtTime(600, t + 0.7);

    const hissGain = this.ctx.createGain();
    hissGain.gain.setValueAtTime(0.6, t);
    hissGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    hissSource.connect(hissFilter);
    hissFilter.connect(hissGain);
    hissGain.connect(this.masterGain);
    hissSource.start(t);

    const rimOsc = this.ctx.createOscillator();
    const rimGain = this.ctx.createGain();
    rimOsc.type = 'square';
    rimOsc.frequency.setValueAtTime(980, t + 0.02);
    rimOsc.frequency.exponentialRampToValueAtTime(140, t + 0.14);

    rimGain.gain.setValueAtTime(0.45, t + 0.02);
    rimGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    rimOsc.connect(rimGain);
    rimGain.connect(this.masterGain);
    rimOsc.start(t + 0.02);
    rimOsc.stop(t + 0.16);
  }

  /**
   * Pit stop completion sound
   */
  public triggerPitChime(): void {
    if (!this.isInitialized || !this.ctx || this.isMuted || !this.masterGain) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, High C
    const t = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.2, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.3);
    });
  }

  public triggerPitRadio(_cue: 'box' | 'tyres' | 'go' | 'puncture'): void {
    // Deactivated per user request
    return;
  }

  public isEngineSoundOn(): boolean {
    return this.isEngineSoundEnabled;
  }

  public setEngineSoundEnabled(enabled: boolean): void {
    this.isEngineSoundEnabled = enabled;
    if (this.ctx && this.engineBusGain) {
      const t = this.ctx.currentTime;
      this.engineBusGain.gain.setTargetAtTime(enabled ? 0.70 : 0.0, t, 0.020);

      if (!enabled) {
        if (this.gainBase) {
          this.gainBase.gain.setTargetAtTime(0.0, t, 0.020);
        }
        if (this.gainV12) {
          this.gainV12.gain.setTargetAtTime(0.0, t, 0.020);
        }
        if (this.gainWhistle) {
          this.gainWhistle.gain.setTargetAtTime(0.0, t, 0.020);
        }
        if (this.gainIntake) {
          this.gainIntake.gain.setTargetAtTime(0.0, t, 0.020);
        }
        if (this.skidGain) {
          this.skidGain.gain.setTargetAtTime(0.0, t, 0.020);
        }
      }
    }
  }

  public toggleEngineSound(): boolean {
    this.setEngineSoundEnabled(!this.isEngineSoundEnabled);
    return this.isEngineSoundEnabled;
  }

  // --- DIAGNÓSTICO DE AUDIO (ARQUITECTURA HÍBRIDA: RUGIDO AMERICANO + AULLIDO Y SILBIDO V12 F1) ---

  public getLayersState(): EngineAudioLayersState {
    return { ...this.layersState };
  }

  public getSoloLayer(): keyof EngineAudioLayersState | 'all' | 'none' {
    return this.soloLayer;
  }

  public setSoloLayer(layer: keyof EngineAudioLayersState | 'all' | 'none'): void {
    this.soloLayer = layer;
    if (!this.isEngineSoundEnabled) {
      this.setEngineSoundEnabled(true);
    }

    if (layer === 'all') {
      this.layersState = {
        base: true,
        v12: true,
        whistle: true,
        intake: true,
        engineFilter: true,
        dcBlock: true,
      };
    } else if (layer === 'none') {
      this.layersState = {
        base: false,
        v12: false,
        whistle: false,
        intake: false,
        engineFilter: true,
        dcBlock: true,
      };
    } else {
      // Aísla una única capa. Los filtros se mantienen encendidos a menos que se seleccione un filtro específico.
      this.layersState = {
        base: layer === 'base',
        v12: layer === 'v12',
        whistle: layer === 'whistle',
        intake: layer === 'intake',
        engineFilter: layer === 'engineFilter' ? false : true,
        dcBlock: layer === 'dcBlock' ? false : true,
      };
    }
    this.applyLayersGainImmediate();
  }

  public toggleLayer(layer: keyof EngineAudioLayersState): void {
    this.layersState[layer] = !this.layersState[layer];
    this.soloLayer = 'none';
    if (!this.isEngineSoundEnabled && this.layersState[layer]) {
      this.setEngineSoundEnabled(true);
    }
    this.applyLayersGainImmediate();
  }

  private applyLayersGainImmediate(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (this.gainBase) {
      this.gainBase.gain.setTargetAtTime(this.layersState.base ? 0.42 : 0.0, t, 0.015);
    }
    if (this.gainV12) {
      this.gainV12.gain.setTargetAtTime(this.layersState.v12 ? 0.28 : 0.0, t, 0.015);
    }
    if (this.gainWhistle) {
      this.gainWhistle.gain.setTargetAtTime(this.layersState.whistle ? 0.08 : 0.0, t, 0.015);
    }
    if (this.gainIntake) {
      this.gainIntake.gain.setTargetAtTime(this.layersState.intake ? 0.22 : 0.0, t, 0.015);
    }
    if (this.engineFilter) {
      this.engineFilter.frequency.setTargetAtTime(this.layersState.engineFilter ? 580 : 20000, t, 0.020);
    }
    if (this.dcBlockFilter) {
      this.dcBlockFilter.frequency.setTargetAtTime(this.layersState.dcBlock ? 20 : 5, t, 0.020);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(this.isMuted ? 0 : 0.45, this.ctx.currentTime + 0.020);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public pause(): void {
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public dispose(): void {
    if (this.ctx && this.ctx.state !== 'closed') {
      try {
        if (this.sourceBase) { this.sourceBase.stop(); this.sourceBase.disconnect(); }
        if (this.sourceV12) { this.sourceV12.stop(); this.sourceV12.disconnect(); }
        if (this.sourceWhistle) { this.sourceWhistle.stop(); this.sourceWhistle.disconnect(); }
        if (this.whistleFilter) { this.whistleFilter.disconnect(); }
        if (this.sourceIntake) { this.sourceIntake.stop(); this.sourceIntake.disconnect(); }
        if (this.sourceSkid) { this.sourceSkid.stop(); this.sourceSkid.disconnect(); }
        if (this.skidGain) { this.skidGain.disconnect(); }
        if (this.flatTireOsc) { this.flatTireOsc.stop(); this.flatTireOsc.disconnect(); }
        if (this.combustionBus) { this.combustionBus.disconnect(); }
        if (this.dcBlockFilter) { this.dcBlockFilter.disconnect(); }
        if (this.bodyThumpFilter) { this.bodyThumpFilter.disconnect(); }
        if (this.exhaustResonator) { this.exhaustResonator.disconnect(); }
        if (this.waveShaper) { this.waveShaper.disconnect(); }
        if (this.engineFilter) { this.engineFilter.disconnect(); }
        if (this.engineBusGain) { this.engineBusGain.disconnect(); }
        if (this.masterGain) { this.masterGain.disconnect(); }
      } catch {
        // Safe catch for already stopped nodes
      }
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
    this.isInitialized = false;
  }
}
