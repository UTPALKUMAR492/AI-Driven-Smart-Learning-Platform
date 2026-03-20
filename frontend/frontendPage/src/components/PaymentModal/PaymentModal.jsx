import React, { useState, useEffect } from 'react'
import './PaymentModal.css'

function detectCardBrand(digits){
  const d = (digits || '').replace(/\D/g, '')
  if (/^4/.test(d)) return 'visa'
  if (/^5[1-5]/.test(d) || /^2(2[2-9]|[3-6]\d|7[01])/.test(d)) return 'mastercard'
  if (/^3[47]/.test(d)) return 'amex'
  return 'card'
}

export default function PaymentModal({ open, onClose, onPay, amount = 0 }) {
  const [name, setName] = useState('')
  const [rawCard, setRawCard] = useState('')
  const [card, setCard] = useState('')
  const [cvv, setCvv] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [address, setAddress] = useState('')
  const [comments, setComments] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [localError, setLocalError] = useState('')
  const [brand, setBrand] = useState('card')

  const formatCard = (v) => (v || '').replace(/[^0-9]/g, '').replace(/(.{4})/g, '$1 ').trim()

  const maskCard = (num) => {
    const cleaned = (num || '').replace(/\s+/g, '')
    if (cleaned.length < 4) return cleaned
    return '**** **** **** ' + cleaned.slice(-4)
  }

  useEffect(() => {
    // ensure rawCard stored as digits up to 16
    const digits = (rawCard || '').replace(/\D/g, '').slice(0, 16)
    if (digits !== rawCard) setRawCard(digits)
    setBrand(detectCardBrand(digits))
    setCard(formatCard(digits))
  }, [rawCard])

  useEffect(() => {
    if (!open) {
      // reset local state when modal closed
      setName(''); setRawCard(''); setCard(''); setCvv(''); setMonth(''); setYear(''); setAddress(''); setComments(''); setProcessing(false); setResult(null); setLocalError('')
    }
  }, [open])

  if (!open) return null


  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    if (!name || !rawCard || !cvv || !month || !year) {
      setLocalError('Please complete card details')
      return
    }

    // Cardholder name should contain letters (not numeric only)
    if (!/[A-Za-z]/.test(String(name || '').trim())) {
      setLocalError('Please enter a valid cardholder name')
      return
    }

    // validate month and year
    const m = parseInt(month, 10)
    const y = parseInt(year, 10)
    const now = new Date()
    const currentYear = now.getFullYear()
    if (isNaN(m) || m < 1 || m > 12) {
      setLocalError('Expiry month must be between 01 and 12')
      return
    }
    if (isNaN(y) || String(year).length !== 4 || y === 0 || y < currentYear - 20) {
      setLocalError('Enter a valid 4-digit expiry year')
      return
    }
    // Additional expiry checks handled above; continue to processing
    setProcessing(true)
    try {
      const cleaned = (rawCard || '').replace(/\D/g, '')
      const payload = {
        cardHolder: name,
        cardLast4: cleaned.slice(-4),
        cardBrand: brand,
        cardNumber: maskCard(cleaned),
        cvv: '***',
        expiry: `${month}/${year}`,
        billingAddress: address,
        comments,
        amount: amount
      }
      const res = await onPay(payload)
      const payment = res?.payment || res
      if (!payment) {
        setLocalError('Payment endpoint did not return a payment object')
        setProcessing(false)
        return
      }
      setResult(payment)
    } catch (err) {
      console.error('Payment error', err)
      setLocalError(err?.response?.data?.message || err?.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    setLocalError('')
    setProcessing(true)
    try {
      const res = await onPay(null, 'rejected')
      const payment = res?.payment || res
      if (!payment) {
        setLocalError('Payment endpoint did not return a payment object')
        setProcessing(false)
        return
      }
      setResult(payment)
    } catch (e) {
      console.error(e)
      setLocalError(e?.response?.data?.message || e?.message || 'Failed to record rejected payment')
    } finally {
      setProcessing(false)
    }
  }

  const copyToClipboard = async (text) => {
    try { await navigator.clipboard.writeText(text); } catch(e) { console.debug('copy failed', e) }
  }

  return (
    <div className="pm-overlay">
      <div className="pm-modal pm-modal--wide">
        <div className="pm-form">
          <div className="pm-header">
            <div>
              <h3>Payment Method</h3>
              <div className="pm-sub">All transactions are secure and encrypted</div>
            </div>
            <button className="btn-ghost" onClick={() => { setResult(null); onClose() }}>×</button>
          </div>

          {!result ? (
            <form onSubmit={handleSubmit} className="pm-form-inner">
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label>Cardholder name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" />

                  <label>Card number</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={card} onChange={e => setRawCard(e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19} />
                    <div style={{ minWidth: 48, textAlign: 'center', alignSelf: 'center' }}>
                      <div style={{ fontSize: 12, color: '#374151' }}>{brand.toUpperCase()}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label>CVV</label>
                      <input value={cvv} onChange={e => setCvv(e.target.value.replace(/[^0-9]/g, '').slice(0,3))} placeholder="123" maxLength={3} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Month</label>
                      <input value={month} onChange={e => setMonth(e.target.value.replace(/[^0-9]/g, ''))} placeholder="MM" maxLength={2} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label>Year</label>
                      <input value={year} onChange={e => setYear(e.target.value.replace(/[^0-9]/g, ''))} placeholder="YYYY" maxLength={4} />
                    </div>
                  </div>

                  <label>Billing Address</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Billing address" />

                  <label>Additional comments</label>
                  <textarea value={comments} onChange={e => setComments(e.target.value)} placeholder="Add any additional comments" />

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 14, color: '#374151' }}>Amount: <strong>₹ {amount}</strong></div>
                    <div className="pm-actions">
                      <button type="submit" className="btn-primary" disabled={processing}>{processing ? 'Processing…' : `Pay ₹ ${amount}`}</button>
                      <button type="button" className="btn-outline" onClick={handleReject} disabled={processing}>Cancel / Reject</button>
                    </div>
                  </div>
                  {localError && <div style={{ color: '#b91c1c', marginTop: 10 }}>{localError}</div>}
                </div>

                <div className="pm-card-ui">
                  <div className="pm-card-face">
                    <div className="pm-chip" />
                    <div className="pm-number">{rawCard ? maskCard(rawCard) : '**** **** **** 3456'}</div>
                    <div className="pm-name">{name || 'John Doe'}</div>
                    <div className="pm-expiry">{month || 'MM'}/{year || 'YYYY'}</div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="pm-result">
              <h4>Payment recorded</h4>
              <div style={{ marginTop: 8 }}>Payment ID: <strong>{result._id}</strong></div>
              <div>Amount: <strong>{result.amount}</strong></div>
              <div>Status: <strong>{result.status}</strong></div>
              <div style={{ marginTop: 12 }}>
                <img alt="qr" src={`https://chart.googleapis.com/chart?cht=qr&chs=220x220&chl=${encodeURIComponent('payment:' + result._id)}`} />
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="btn-primary" onClick={() => { copyToClipboard(result._id); onClose(); }}>Done</button>
                <button className="btn-outline" onClick={() => copyToClipboard('payment:' + result._id)}>Copy QR Text</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
