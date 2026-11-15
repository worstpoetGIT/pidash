// Light-to-medium haptics for every tap.
// Native (Capacitor) builds use the real Taptic Engine with Light/Medium impacts.
// iOS Safari / home-screen web app has no vibrate API, so we use the iOS 18 "switch checkbox" tick (one fixed gentle strength).
import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

const NATIVE = Capacitor.isNativePlatform()
let label = null
let last = 0

function ensureSwitch() {
  if (label) return
  const id = 'dq-haptic'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  input.id = id
  input.tabIndex = -1
  input.setAttribute('aria-hidden', 'true')
  label = document.createElement('label')
  label.htmlFor = id
  label.setAttribute('aria-hidden', 'true')
  const hide = 'position:fixed;left:-40px;top:-40px;width:1px;height:1px;opacity:0;pointer-events:none;'
  input.style.cssText = hide
  label.style.cssText = hide
  label.appendChild(input)
  document.body.appendChild(label)
}

export function haptic(kind = 'light') {
  const now = performance.now()
  if (now - last < 40) return
  last = now
  try {
    if (NATIVE) {
      if (kind === 'success') Haptics.notification({ type: NotificationType.Success }).catch(() => {})
      else Haptics.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {})
      return
    }
    if (navigator.vibrate) { navigator.vibrate(kind === 'medium' ? 18 : 9); return }
    ensureSwitch()
    label.click()
  } catch { /* haptics are best-effort */ }
}

const PRESS = 'button, [role="button"], [role="radio"], a[href], select, summary, .hist-item, label.row'
const MEDIUM = '.fab, .btn:not(.ghost), .del, .swipe-del, .key.ok, .save'

export function initHaptics() {
  document.addEventListener('click', (e) => {
    const t = e.target instanceof Element ? e.target.closest(PRESS) : null
    if (!t || t.disabled || t.closest('[data-nohaptic]') || t.getAttribute('aria-disabled') === 'true') return
    haptic(t.matches(MEDIUM) ? 'medium' : 'light')
  }, true)
}
