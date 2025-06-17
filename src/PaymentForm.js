import React, { useState } from "react";
import "./PaymentForm.css";

export default function PaymentForm({ purchases = [], onRecordPayment }) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  // Filter purchases that have dueAmount > 0
  const purchasesWithDue = purchases
    .map((p, idx) => ({ ...p, originalIndex: idx }))
    .filter((p) => (p.dueAmount ?? 0) > 0);

  const submit = (e) => {
    e.preventDefault();

    if (selectedIndex === -1) {
      alert("Please select a valid purchase.");
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (!amount || isNaN(paymentAmount) || paymentAmount <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    const dateToUse = paymentDate ? new Date(paymentDate) : new Date();

    // Use the original index of purchase from filtered list
    onRecordPayment(selectedIndex, paymentAmount, dateToUse);

    // Reset form
    setSelectedIndex(-1);
    setAmount("");
    setPaymentDate("");
  };

  return (
    <form onSubmit={submit} className="payment-form" noValidate>
      <h3>Record Payment</h3>

      <label>
        Select Purchase *
        <select
          value={selectedIndex}
          onChange={(e) => setSelectedIndex(parseInt(e.target.value, 10))}
          className="select-input"
          required
        >
          <option value={-1} disabled>
            Select Purchase
          </option>
          {purchasesWithDue.map((p) => (
            <option key={p.originalIndex} value={p.originalIndex}>
              {p.item} — Due: ₹{p.dueAmount.toFixed(2)}
            </option>
          ))}
        </select>
      </label>

      <label>
        Payment Amount ₹ *
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          step="0.01"
          min="0.01"
          className="text-input"
          required
        />
      </label>

      <label>
        Payment Date
        <input
          type="date"
          value={paymentDate}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="text-input"
        />
      </label>

      <button type="submit" className="btn-submit">
        Make Payment
      </button>
    </form>
  );
}
