import React, { useState } from "react";

export const weightRanges = {
  1: "1-2",
  2: "2-3",
  3: "3-4",
  // add more if needed
};

export const quantityRanges = {
  1: "1-10",
  2: "11-20",
  3: "21-30",
  // add more as needed
};

function quantityToRange(quantity) {
  if (quantity >= 1 && quantity <= 10) return 1;
  if (quantity >= 11 && quantity <= 20) return 2;
  if (quantity >= 21 && quantity <= 30) return 3;
  // add more ranges as needed
  return 0; // unknown or out of range
}

function ItemForm({ onSubmit, initialData = {}, onCancel }) {
  const [name, setName] = useState(initialData.name || "");
  const [weight, setWeight] = useState(initialData.weight || 1);
  const [quantity, setQuantity] = useState(initialData.quantity || 1);
  const [purity, setPurity] = useState(initialData.purity || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, weight, quantity, purity });
    setName("");
    setWeight(1);
    setQuantity(1);
    setPurity("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
      <label>
        Name:
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          type="text"
        />
      </label>

      <label>
        Weight Range:
        <select
          value={weight}
          onChange={(e) => setWeight(Number(e.target.value))}
        >
          {Object.entries(weightRanges).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Quantity (actual number):
        <input
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          required
        />
      </label>

      <label>
        Purity:
        <input
          value={purity}
          onChange={(e) => setPurity(e.target.value)}
          required
          type="text"
        />
      </label>

      <div>
        <button type="submit">Save Item</button>
        {onCancel && (
          <button type="button" onClick={onCancel} style={{ marginLeft: "10px" }}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export { quantityToRange };
export default ItemForm;
