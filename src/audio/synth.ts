export class StarSynth {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private bgmNodes: AudioNode[] = []
  private bgmTimer: number | null = null
  muted = false
  volume = 0.22

  private ensure() {
    if (this.ctx) return
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = this.volume
    master.connect(ctx.destination)
    this.ctx = ctx
    this.master = master
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

  private arpScale = [261.6, 329.6, 392, 523.3, 659.3, 784, 1047]

  pop(combo: number) {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const master = this.master!

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

  stripedClear() {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const master = this.master!
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
    const master = this.master!
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
    const master = this.master!
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
    gain.connect(this.master!)
    osc.start()
    osc.stop(ctx.currentTime + 0.26)
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
      gain.connect(this.master!)
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
      gain.connect(this.master!)
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
      gain.connect(this.master!)
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
    gain.connect(this.master!)
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
    gain.connect(this.master!)
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  }

  swap() {
    this.whoosh()
  }

  win() {
    this.fanfare()
  }

  lose() {
    this.invalid()
  }
}

export const synth = new StarSynth()
