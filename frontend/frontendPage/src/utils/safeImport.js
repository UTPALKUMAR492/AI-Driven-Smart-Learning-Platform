export default async function safeImport(importer) {
  try {
    return await importer()
  } catch (err) {
    // Try to log a safe representation without triggering devtools stringify bugs
    try {
      const msg = err && err.message ? err.message : String(err)
      console.warn('safeImport: dynamic import failed:', msg)
    } catch (e) {
      try { console.warn('safeImport: dynamic import failed: (unserializable error)') } catch (_) {}
    }
    // Rethrow a real Error with message to ensure React.lazy receives an Error object
    throw new Error('Dynamic import failed: ' + (err && err.message ? err.message : String(err)))
  }
}
