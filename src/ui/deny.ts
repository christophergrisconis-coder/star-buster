import { synth } from '~/audio/synth'

export function denyEntry(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) {
    synth.invalid()
    return
  }
  el.classList.remove('lock-deny')
  void el.offsetWidth
  el.classList.add('lock-deny')
  synth.invalid()
}
