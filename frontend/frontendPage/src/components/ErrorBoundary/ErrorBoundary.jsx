import React from 'react'

function safeStringify(obj) {
  try {
    return JSON.stringify(obj)
  } catch (e) {
    // circular or other issues — fallback to toString
    try { return String(obj) } catch (_) { return '[unserializable object]' }
  }
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, message: null }
  }

  static getDerivedStateFromError(error) {
    const message = error && error.message ? error.message : null
    return { hasError: true, error, message }
  }

  componentDidCatch(error, info) {
    // Log a safe, non-circular representation so devtools formatting won't crash
    const msg = error && error.message ? error.message : safeStringify(error)
    const stack = error && error.stack ? error.stack : null
    console.warn('ErrorBoundary caught error:', msg)
    if (stack) console.warn(stack)
    console.warn('ErrorBoundary info:', safeStringify(info))
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding:20}}>
          <h2>Something went wrong.</h2>
          {this.state.message && <p><strong>Error:</strong> {this.state.message}</p>}
          <details style={{whiteSpace: 'pre-wrap'}}>
            {this.state.error && (this.state.error.stack || safeStringify(this.state.error))}
          </details>
        </div>
      )
    }
    return this.props.children
  }
}
