import { useState } from 'react';
import './PaymentModal.css';

const PaymentModal = ({ isOpen, onClose, onConfirm, reservation, timeLeft, formatTime }) => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (paymentMethod === 'card') {
      if (!cardNumber || !cardName || !expiryDate || !cvv) {
        setError('Please fill in all card details');
        return;
      }
      if (cardNumber.replace(/\s/g, '').length < 16) {
        setError('Please enter a valid card number');
        return;
      }
    }

    setIsProcessing(true);

    // Simulate payment processing (2 seconds)
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm();
    }, 2000);
  };

  const formatCardNumber = value => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = value => {
    const v = value.replace(/\D/g, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  return (
    <div className="payment-modal-overlay" onClick={onClose}>
      <div className="payment-modal" onClick={e => e.stopPropagation()}>
        <div className="payment-modal-header">
          <h2>Complete Payment</h2>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="payment-timer">
          <span className="timer-label">Time remaining:</span>
          <span className="timer-value">{formatTime(timeLeft)}</span>
        </div>

        <div className="reservation-summary">
          <h3>Reservation Details</h3>
          <p>
            <strong>Seats:</strong> {reservation.seatNumbers.join(', ')}
          </p>
          <p>
            <strong>Total Amount:</strong> ${(reservation.seatNumbers.length * 50).toFixed(2)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="payment-method-selector">
            <label>
              <input
                type="radio"
                value="card"
                checked={paymentMethod === 'card'}
                onChange={e => setPaymentMethod(e.target.value)}
              />
              Credit/Debit Card
            </label>
            <label>
              <input
                type="radio"
                value="wallet"
                checked={paymentMethod === 'wallet'}
                onChange={e => setPaymentMethod(e.target.value)}
              />
              Digital Wallet
            </label>
          </div>

          {paymentMethod === 'card' && (
            <div className="card-form">
              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                  maxLength={19}
                />
              </div>
              <div className="form-group">
                <label>Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={e => setCardName(e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={e => setExpiryDate(formatExpiryDate(e.target.value))}
                    maxLength={5}
                  />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    placeholder="123"
                    value={cvv}
                    onChange={e => setCvv(e.target.value.replace(/\D/g, '').substring(0, 3))}
                    maxLength={3}
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'wallet' && (
            <div className="wallet-form">
              <div className="form-group">
                <label>Select Wallet</label>
                <select>
                  <option>PayPal</option>
                  <option>Google Pay</option>
                  <option>Apple Pay</option>
                  <option>Stripe</option>
                </select>
              </div>
              <p className="wallet-note">You will be redirected to your wallet for payment</p>
            </div>
          )}

          {error && <div className="payment-error">{error}</div>}

          <div className="payment-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button type="submit" className="pay-button" disabled={isProcessing}>
              {isProcessing
                ? 'Processing Payment...'
                : `Pay $${(reservation.seatNumbers.length * 50).toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
