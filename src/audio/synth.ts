export class StarSynth {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private sfxBus: GainNode | null = null
  private musicBus: GainNode | null = null
  private bgmNodes: AudioNode[] = []
  private bgmTimer: number | null = null
  private lastMatchCue = 0
  muted = false
  volume = 0.22
  sfxVolume = 1
  musicVolume = 1

  private ensure() {
    if (this.ctx) return
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = this.volume
    master.connect(ctx.destination)
    const sfxBus = ctx.createGain()
    sfxBus.gain.value = this.sfxVolume
    sfxBus.connect(master)
    const musicBus = ctx.createGain()
    musicBus.gain.value = this.musicVolume
    musicBus.connect(master)
    this.ctx = ctx
    this.master = master
    this.sfxBus = sfxBus
    this.musicBus = musicBus
  }

  /** All one-shot SFX route through here so the SFX slider affects them. */
  private get sfx(): GainNode {
    this.ensure()
    return this.sfxBus!
  }

  private get music(): GainNode {
    this.ensure()
    return this.musicBus!
  }

  async resume() {
    this.ensure()
    if (this.ctx?.state === 'suspended') await this.ctx.resume()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.05)
    }
  }

  setSfxVolume(v: number) {
    this.sfxVolume = Math.min(1, Math.max(0, v))
    if (this.sfxBus && this.ctx) {
      this.sfxBus.gain.setTargetAtTime(this.sfxVolume, this.ctx.currentTime, 0.04)
    }
  }

  setMusicVolume(v: number) {
    this.musicVolume = Math.min(1, Math.max(0, v))
    if (this.musicBus && this.ctx) {
      this.musicBus.gain.setTargetAtTime(this.musicVolume, this.ctx.currentTime, 0.04)
    }
  }

  private arpScale = [261.6, 329.6, 392, 523.3, 659.3, 784, 1047]

  pop(combo: number) {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const master = this.sfx

    const noteIndex = Math.min(combo - 1, this.arpScale.length - 1)
    const freq = this.arpScale[Math.max(0, noteIndex)]! * (1 + combo * 0.02)

    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    osc.type = combo >= 4 ? 'sawtooth' : 'triangle'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.85, ctx.currentTime + 0.09)
    filter.type = 'lowpass'
    filter.frequency.value = 2200 + combo * 320
    filter.Q.value = 7 + combo
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(Math.min(0.38, 0.22 + combo * 0.02), ctx.currentTime + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15 + combo * 0.01)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(master)
    osc.start()
    osc.stop(ctx.currentTime + 0.2 + combo * 0.01)

    const ping = ctx.createOscillator()
    const pingGain = ctx.createGain()
    ping.type = 'sine'
    ping.frequency.setValueAtTime(freq * 2.15, ctx.currentTime)
    ping.frequency.exponentialRampToValueAtTime(freq * 3.1, ctx.currentTime + 0.07)
    pingGain.gain.setValueAtTime(0.0001, ctx.currentTime)
    pingGain.gain.exponentialRampToValueAtTime(0.12 + combo * 0.015, ctx.currentTime + 0.01)
    pingGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11)
    ping.connect(pingGain)
    pingGain.connect(master)
    ping.start()
    ping.stop(ctx.currentTime + 0.12)

    if (combo >= 3) {
      const shimmer = ctx.createOscillator()
      const shimGain = ctx.createGain()
      shimmer.type = 'sine'
      shimmer.frequency.setValueAtTime(freq * 4, ctx.currentTime + 0.04)
      shimmer.frequency.exponentialRampToValueAtTime(freq * 5.5, ctx.currentTime + 0.1)
      shimGain.gain.setValueAtTime(0.0001, ctx.currentTime + 0.04)
      shimGain.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.055)
      shimGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14)
      shimmer.connect(shimGain)
      shimGain.connect(master)
      shimmer.start(ctx.currentTime + 0.04)
      shimmer.stop(ctx.currentTime + 0.15)
    }
  }

  /** A tiny character voice layered under a clear, never a spoken clip. */
  starReaction(combo: number, reaction: 'dance' | 'spin' | 'cry' | 'launch' | 'supernova') {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const base = reaction === 'cry' ? 340 : reaction === 'supernova' ? 190 : reaction === 'launch' ? 250 : 440
    osc.type = reaction === 'cry' ? 'sine' : reaction === 'spin' ? 'triangle' : 'square'
    osc.frequency.setValueAtTime(base + combo * 18, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(
      reaction === 'cry' ? base * 0.55 : base * (reaction === 'launch' ? 2.4 : 1.45),
      ctx.currentTime + 0.13,
    )
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16)
    osc.connect(gain)
    gain.connect(this.master!)
    osc.start()
    osc.stop(ctx.currentTime + 0.18)
  }

  /**
   * One directed cue per resolved wave. It prevents the old pop + explosion +
   * voice pile-up while still letting the stars sound like small characters.
   */
  matchReaction({
    combo,
    destroyed,
    cause,
    reaction,
    coAdmin = false,
  }: {
    combo: number
    destroyed: number
    cause: 'match' | 'cascade' | 'ignite' | 'special-combo' | 'hammer' | 'well' | 'shuffle' | 'splash' | 'finale' | 'settle'
    reaction: 'dance' | 'spin' | 'cry' | 'launch' | 'supernova'
    coAdmin?: boolean
  }) {
    if (this.muted) return
    const now = performance.now()
    // Long cascades can resolve only a few frames apart. Coalesce those waves
    // instead of creating a painful wall of oscillators.
    if (now - this.lastMatchCue < 48) return
    this.lastMatchCue = now

    if (cause === 'hammer') this.boosterFire('hammer')
    else if (cause === 'well') this.gravitySuck()
    else if (cause === 'splash') this.chromaSplash()
    else if (cause === 'shuffle') this.boosterFire('shuffle')
    else if (cause === 'ignite') this.solarIgnite()
    else {
      this.pop(combo)
      if (destroyed >= 8 || combo >= 3) this.explode(destroyed >= 14 ? 'L' : 'M')
    }
    this.starReaction(combo + (coAdmin ? 1 : 0), coAdmin && reaction === 'cry' ? 'dance' : reaction)
    if (coAdmin && combo >= 2) this.heartTwinkle(combo)
  }

  wrappedBurst() {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    ;[0, 0.11].forEach((offset, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(i ? 96 : 150, ctx.currentTime + offset)
      osc.frequency.exponentialRampToValueAtTime(i ? 42 : 68, ctx.currentTime + offset + 0.24)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset)
      gain.gain.exponentialRampToValueAtTime(i ? 0.2 : 0.14, ctx.currentTime + offset + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.3)
      osc.connect(gain)
      gain.connect(this.master!)
      osc.start(ctx.currentTime + offset)
      osc.stop(ctx.currentTime + offset + 0.31)
    })
  }

  private gravitySuck() {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(260, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(44, ctx.currentTime + 0.32)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    osc.connect(gain); gain.connect(this.master!); osc.start(); osc.stop(ctx.currentTime + 0.36)
  }

  private chromaSplash() {
    this.stripedClear()
    this.starReaction(3, 'dance')
  }

  private solarIgnite() {
    this.wrappedBurst()
    this.starReaction(4, 'launch')
  }

  private heartTwinkle(combo: number) {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    ;[0, 0.065].forEach((offset, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = (i ? 659.3 : 523.3) * (1 + Math.min(combo, 5) * 0.025)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset)
      gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + offset + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.16)
      osc.connect(gain); gain.connect(this.master!); osc.start(ctx.currentTime + offset); osc.stop(ctx.currentTime + offset + 0.17)
    })
  }

  loveChime() {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    ;[0, 0.1, 0.2].forEach((offset, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = [523.3, 659.3, 783.99][i]!
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset)
      gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + offset + 0.32)
      osc.connect(gain)
      gain.connect(this.master!)
      osc.start(ctx.currentTime + offset)
      osc.stop(ctx.currentTime + offset + 0.34)
    })
  }

  stripedClear() {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const master = this.sfx
    ;[0, 0.04, 0.08].forEach((t, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.value = 200 + i * 180
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + t + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.18)
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.value = 800 + i * 300
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(master)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.2)
    })
  }

  colorBombBlast() {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const master = this.sfx
    const notes = [261.6, 329.6, 392, 523.3, 659.3]
    notes.forEach((freq, i) => {
      const t = i * 0.06
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.22)
      osc.connect(gain)
      gain.connect(master)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.24)
    })
  }

  gachaReveal(rarity: 'common' | 'rare' | 'epic' | 'legendary') {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const master = this.sfx
    const noteMap = {
      common: [392, 523],
      rare: [392, 523, 659],
      epic: [392, 523, 659, 784],
      legendary: [392, 494, 587, 659, 784, 1047],
    }
    const notes = noteMap[rarity]
    notes.forEach((freq, i) => {
      const t = i * 0.1
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = rarity === 'legendary' ? 'sawtooth' : 'triangle'
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = rarity === 'legendary' ? 3000 : 1800
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(rarity === 'legendary' ? 0.25 : 0.18, ctx.currentTime + t + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.35)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(master)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.38)
    })
  }

  whoosh() {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(90, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.2)
    filter.type = 'bandpass'
    filter.frequency.value = 600
    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfx)
    osc.start()
    osc.stop(ctx.currentTime + 0.26)
  }

  /** A short, readable confirmation that a board tool is armed. */
  boosterArm(kind: 'flare' | 'hammer' | 'well' | 'splash' | 'moves' | 'orbit' | 'shield' | 'shuffle') {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const base = kind === 'well' ? 168 : kind === 'hammer' ? 132 : kind === 'splash' ? 296 : 236
    osc.type = kind === 'hammer' ? 'square' : 'triangle'
    osc.frequency.setValueAtTime(base, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(base * 1.48, ctx.currentTime + 0.1)
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(this.master!)
    osc.start()
    osc.stop(ctx.currentTime + 0.16)
  }

  boosterFire(kind: 'flare' | 'hammer' | 'well' | 'splash' | 'moves' | 'orbit' | 'shield' | 'shuffle') {
    if (kind === 'hammer') {
      this.explode('S')
      return
    }
    if (kind === 'well') {
      this.colorBombBlast()
      return
    }
    if (kind === 'splash') {
      this.stripedClear()
      return
    }
    if (kind === 'flare') {
      this.fanfare()
      return
    }
    this.whoosh()
  }

  fanfare() {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    ;[0, 0.12, 0.24].forEach((t, i) => {
      const osc = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = [392, 523, 784][i]!
      filter.type = 'lowpass'
      filter.frequency.value = 1400
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.28)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.sfx)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.3)
    })
  }

  startBgm() {
    if (this.muted) return
    this.ensure()
    this.stopBgm()
    const ctx = this.ctx!
    const pad = () => {
      const osc = ctx.createOscillator()
      const osc2 = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc2.type = 'sine'
      osc.frequency.value = 98
      osc2.frequency.value = 98 * 1.01
      filter.type = 'lowpass'
      filter.frequency.value = 420
      gain.gain.value = 0.07
      osc.connect(filter)
      osc2.connect(filter)
      filter.connect(gain)
      gain.connect(this.music)
      osc.start()
      osc2.start()
      this.bgmNodes.push(osc, osc2, filter, gain)
    }
    pad()
    const pulse = () => {
      if (this.muted || !this.ctx) return
      const osc = ctx.createOscillator()
      const filter = ctx.createBiquadFilter()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      const notes = [196, 247, 294, 392]
      osc.frequency.value = notes[Math.floor(Math.random() * notes.length)]!
      filter.type = 'highpass'
      filter.frequency.value = 180
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(this.sfx)
      osc.start()
      osc.stop(ctx.currentTime + 0.52)
    }
    pulse()
    this.bgmTimer = window.setInterval(pulse, 1600)
  }

  stopBgm() {
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer)
      this.bgmTimer = null
    }
    for (const n of this.bgmNodes) {
      try {
        if ('stop' in n && typeof n.stop === 'function') n.stop()
        n.disconnect()
      } catch {
        /* already stopped */
      }
    }
    this.bgmNodes = []
  }

  explode(size: 'S' | 'M' | 'L' = 'M') {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    const base = size === 'L' ? 70 : size === 'M' ? 90 : 120
    osc.frequency.setValueAtTime(base, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(base * 0.4, ctx.currentTime + 0.22)
    filter.type = 'lowpass'
    filter.frequency.value = size === 'L' ? 900 : 1400
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.28)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfx)
    osc.start()
    osc.stop(ctx.currentTime + 0.3)
  }

  banner(word?: string) {
    if (word === 'GALAXY BUSTER' || word === 'SUPERNOVA') {
      this.colorBombBlast()
    } else if (word === 'STELLAR' || word === 'SUPERSTAR') {
      this.stripedClear()
    } else {
      this.fanfare()
    }
  }

  invalid() {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(180, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.12)
    filter.type = 'lowpass'
    filter.frequency.value = 500
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.14)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfx)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  }

  swap() {
    this.whoosh()
  }

  /** Short UI click for buttons and tab switches. */
  tick() {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.03)
    gain.gain.setValueAtTime(0.09, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06)
    osc.connect(gain)
    gain.connect(this.sfx)
    osc.start()
    osc.stop(ctx.currentTime + 0.07)
  }

  /** Soft thud when refilled stars settle after gravity. */
  land() {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(180, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.09)
    filter.type = 'lowpass'
    filter.frequency.value = 500
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfx)
    osc.start()
    osc.stop(ctx.currentTime + 0.12)
  }

  /** Twinkle when a special star spawns on the board. */
  spark() {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    ;[1568, 2093, 2637].forEach((freq, i) => {
      const t = i * 0.035
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.07, ctx.currentTime + t + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.12)
      osc.connect(gain)
      gain.connect(this.sfx)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.13)
    })
  }

  /** Urgent pulse when moves run low. */
  heartbeat() {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    ;[0, 0.16].forEach((t) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(90, ctx.currentTime + t)
      osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + t + 0.1)
      gain.gain.setValueAtTime(0.14, ctx.currentTime + t)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.12)
      osc.connect(gain)
      gain.connect(this.sfx)
      osc.start(ctx.currentTime + t)
      osc.stop(ctx.currentTime + t + 0.13)
    })
  }

  /** Rich rising fanfare for the campaign finale and huge wins. */
  bigWin() {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const chords = [
      [261.6, 329.6, 392],
      [329.6, 415.3, 493.9],
      [392, 493.9, 587.3],
      [523.3, 659.3, 784, 1046.5],
    ]
    chords.forEach((chord, ci) => {
      const t = ci * 0.22
      for (const freq of chord) {
        const osc = ctx.createOscillator()
        const filter = ctx.createBiquadFilter()
        const gain = ctx.createGain()
        osc.type = ci === chords.length - 1 ? 'sawtooth' : 'triangle'
        osc.frequency.value = freq
        filter.type = 'lowpass'
        filter.frequency.value = 2400
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + t)
        gain.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + t + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + (ci === chords.length - 1 ? 0.9 : 0.3))
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(this.sfx)
        osc.start(ctx.currentTime + t)
        osc.stop(ctx.currentTime + t + (ci === chords.length - 1 ? 0.95 : 0.32))
      }
    })
  }

  win() {
    this.fanfare()
  }

  lose() {
    this.invalid()
  }
}

export const synth = new StarSynth()
