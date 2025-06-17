import React, { useState } from "react";

export default function PaymentForm({ purchases = [], onRecordPayment }) {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  const submit = (e) => {
    e.preventDefault();

    if (selectedIndex < 0 || selectedIndex >= purchases.length) {
      alert("Please select a valid purchase.");
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (!amount || isNaN(paymentAmount) || paymentAmount <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    const dateToUse = paymentDate ? new Date(paymentDate) : new Date();

    onRecordPayment(selectedIndex, paymentAmount, dateToUse);

    // Reset form
    setSelectedIndex(-1);
    setAmount("");
    setPaymentDate("");
  };

  return (
    <form onSubmit={submit} className="form">
      <h3>Record Payment</h3>
      <select
        value={selectedIndex}
        onChange={(e) => setSelectedIndex(parseInt(e.target.value, 10))}
      >
        <option value={-1}>Select Purchase</option>
        {purchases.map((p, i) => (
          <option key={i} value={i}>
            {p.item} - Due: ₹{p.dueAmount?.toFixed(2) || "0.00"}
          </option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Payment Amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        step="0.01"
        min="0"
      />
      <input
        type="date"
        value={paymentDate}
        onChange={(e) => setPaymentDate(e.target.value)}
      />
      <button type="submit">Make Payment</button>
    </form>
  );
}
