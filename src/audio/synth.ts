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

  pop(combo: number) {
    if (this.muted) return
    this.ensure()
    const ctx = this.ctx!
    const master = this.master!
    const osc = ctx.createOscillator()
    const filter = ctx.createBiquadFilter()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    const freq = 320 * Math.pow(1.145, Math.min(combo, 16))
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(freq * 1.85, ctx.currentTime + 0.09)
    filter.type = 'lowpass'
    filter.frequency.value = 2200 + combo * 260
    filter.Q.value = 7
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.32, ctx.currentTime + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(master)
    osc.start()
    osc.stop(ctx.currentTime + 0.17)
    const ping = ctx.createOscillator()
    const pingGain = ctx.createGain()
    ping.type = 'sine'
    ping.frequency.setValueAtTime(freq * 2.15, ctx.currentTime)
    ping.frequency.exponentialRampToValueAtTime(freq * 3.1, ctx.currentTime + 0.07)
    pingGain.gain.setValueAtTime(0.0001, ctx.currentTime)
    pingGain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01)
    pingGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.11)
    ping.connect(pingGain)
    pingGain.connect(master)
    ping.start()
    ping.stop(ctx.currentTime + 0.12)
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

  banner() {
    this.fanfare()
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
