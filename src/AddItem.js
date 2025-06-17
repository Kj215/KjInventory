import React, { useState } from "react";
import "./AddItem.css";

function AddItem({ addItem, existingNames = [], existingPurities = [] }) {
  const [name, setName] = useState("");
  const [weight, setWeight] = useState("");
  const [purity, setPurity] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !weight || !purity.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    const parsedWeight = parseFloat(weight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      alert("Please enter a valid positive number for weight.");
      return;
    }

    setIsAdding(true);
    try {
      await addItem({
        name: name.trim(),
        weight: parsedWeight,
        purity: purity.trim(),
      });

      setName("");
      setWeight("");
      setPurity("");
    } catch (error) {
      alert("Failed to add item: " + error.message);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <form className="add-item-form" onSubmit={handleSubmit}>
      <div>
        <label>
          Name:
          <input
            list="name-list"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type or select a name"
            disabled={isAdding}
            required
          />
          <datalist id="name-list">
            {existingNames.map((n, i) => (
              <option key={i} value={n} />
            ))}
          </datalist>
        </label>
      </div>
      <div>
        <label>
          Weight (exact):
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            disabled={isAdding}
            required
            placeholder="Enter exact weight"
          />
        </label>
      </div>
      <div>
        <label>
          Purity:
          <input
            list="purity-list"
            value={purity}
            onChange={(e) => setPurity(e.target.value)}
            placeholder="Type or select purity"
            disabled={isAdding}
            required
          />
          <datalist id="purity-list">
            {existingPurities.map((p, i) => (
              <option key={i} value={p} />
            ))}
          </datalist>
        </label>
      </div>
      <button type="submit" className="add-item-submit" disabled={isAdding}>
        {isAdding ? "Adding..." : "Add Item"}
      </button>
    </form>
  );
}

export default AddItem;
