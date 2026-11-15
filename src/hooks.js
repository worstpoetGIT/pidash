import { useEffect, useState } from 'react'

export function useDark() {
  const get = () => {
    const t = document.documentElement.dataset.theme
    if (t) return t === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  const [d, setD] = useState(get)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const h = () => setD(get())
    mq.addEventListener('change', h)
    const mo = new MutationObserver(h)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    h()
    return () => { mq.removeEventListener('change', h); mo.disconnect() }
  }, [])
  return d
}
