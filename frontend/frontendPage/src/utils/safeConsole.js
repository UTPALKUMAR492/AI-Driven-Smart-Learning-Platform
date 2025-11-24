// Safe console wrappers to avoid devtools formatting crashes when logging circular or unusual objects
const isPrimitive = (v) => v === null || (typeof v !== 'object' && typeof v !== 'function')

function safeFormatArg(arg) {
  if (isPrimitive(arg)) return arg
  try {
    return JSON.parse(JSON.stringify(arg))
  } catch (e) {
    try {
      return String(arg)
    } catch (_) {
      return '[unserializable]'
    }
  }
}

export default function installSafeConsole() {
  if (typeof window === 'undefined') return
  const methods = ['log', 'info', 'warn', 'error', 'debug']
  methods.forEach((m) => {
    const orig = console[m]
    if (!orig || orig.__safeWrapped) return
    const wrapped = function(...args) {
      try {
        const safeArgs = args.map(a => safeFormatArg(a))
        return orig.apply(console, safeArgs)
      } catch (err) {
        try { return orig.call(console, 'Logging failed:', String(err)) } catch (_) {}
      }
    }
    wrapped.__safeWrapped = true
    console[m] = wrapped
  })
}
