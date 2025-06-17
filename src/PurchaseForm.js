import React, { useState } from "react";
import "./PurchaseForm.css";

export default function PurchaseForm({ onAddPurchase }) {
  const [description, setDescription] = useState("");
  const [item, setItem] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [date, setDate] = useState("");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!item.trim()) newErrors.item = "Item Purchased is required";
    if (!billAmount || isNaN(billAmount) || Number(billAmount) <= 0)
      newErrors.billAmount = "Please enter a valid Bill Amount (> 0)";
    if (amountPaid && (isNaN(amountPaid) || Number(amountPaid) < 0))
      newErrors.amountPaid = "Amount Paid must be zero or positive number";
    return newErrors;
  };

  const submit = (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    onAddPurchase({
      description: description.trim(),
      item: item.trim(),
      billAmount: parseFloat(billAmount),
      amountPaid: amountPaid ? parseFloat(amountPaid) : 0,
      date: date ? new Date(date) : new Date(),
    });

    setDescription("");
    setItem("");
    setBillAmount("");
    setAmountPaid("");
    setDate("");
    setErrors({});
  };

  return (
    <form onSubmit={submit} className="form modern-purchase-form" noValidate>
      <h3>Add Purchase</h3>

      <div className="input-group">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          placeholder="Optional description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      <div className="input-group">
        <label htmlFor="item">Item Purchased *</label>
        <input
          id="item"
          type="text"
          placeholder="Enter item name"
          value={item}
          onChange={(e) => setItem(e.target.value)}
          className={errors.item ? "error" : ""}
        />
        {errors.item && <small className="error-text">{errors.item}</small>}
      </div>

      <div className="input-group">
        <label htmlFor="billAmount">Bill Amount ₹ *</label>
        <input
          id="billAmount"
          type="number"
          placeholder="0.00"
          min="0"
          step="0.01"
          value={billAmount}
          onChange={(e) => setBillAmount(e.target.value)}
          className={errors.billAmount ? "error" : ""}
        />
        {errors.billAmount && (
          <small className="error-text">{errors.billAmount}</small>
        )}
      </div>

      <div className="input-group">
        <label htmlFor="amountPaid">Amount Paid Now ₹</label>
        <input
          id="amountPaid"
          type="number"
          placeholder="0.00"
          min="0"
          step="0.01"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          className={errors.amountPaid ? "error" : ""}
        />
        {errors.amountPaid && (
          <small className="error-text">{errors.amountPaid}</small>
        )}
      </div>

      <div className="input-group">
        <label htmlFor="date">Date</label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <button type="submit" className="btn-submit">
        Add Purchase
      </button>
    </form>
  );
}
