import React, { useState } from "react";

function AddItemForm({ onItemAdded, existingNames = [], existingPurities = [] }) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [size, setSize] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [saleDate, setSaleDate] = useState("");
  const [purity, setPurity] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !weight || !size.trim() || !purchaseDate || !purity.trim()) {
      alert("Please fill in all required fields (Name, Purity, Weight, Size, Purchase Date)");
      return;
    }
    setLoading(true);
    try {
      // Submit logic here, e.g. call props function, send to Firestore etc.

      alert("Item added successfully!");

      // Reset form
      setName("");
      setPurity("");
      setWeight("");
      setSize("");
      setPurchaseDate("");
      setSaleDate("");

      if (onItemAdded) onItemAdded();
    } catch (error) {
      alert("Failed to add item: " + error.message);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: "auto" }}>
      <h2>Add New Item</h2>

      <label>
        Name*:
        <select value={name} onChange={(e) => setName(e.target.value)} required>
          <option value="">-- Select or type a name --</option>
          {existingNames.map((n, i) => (
            <option key={i} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <label>
        Purity*:
        <select value={purity} onChange={(e) => setPurity(e.target.value)} required>
          <option value="">-- Select purity --</option>
          {existingPurities.map((p, i) => (
            <option key={i} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <label>
        Weight (grams)*:
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          min="0"
          step="0.01"
          required
          placeholder="Weight in grams"
        />
      </label>

      <label>
        Size*:
        <input
          type="text"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          required
          placeholder="Size category"
        />
      </label>

      <label>
        Purchase Date*:
        <input
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          required
        />
      </label>

      <label>
        Sale Date (optional):
        <input
          type="date"
          value={saleDate}
          onChange={(e) => setSaleDate(e.target.value)}
        />
      </label>

      <button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Item"}
      </button>

      <style>{`
        form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #fafafa;
        }
        label {
          display: flex;
          flex-direction: column;
          font-weight: 600;
          font-size: 14px;
        }
        select, input {
          margin-top: 4px;
          padding: 8px;
          font-size: 14px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        button {
          padding: 10px;
          background: #007bff;
          color: white;
          font-weight: 700;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          margin-top: 8px;
        }
        button:disabled {
          background: #aaa;
          cursor: not-allowed;
        }
      `}</style>
    </form>
  );
}

export default AddItemForm;
