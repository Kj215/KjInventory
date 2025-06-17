import React from "react";
import "./ItemSummary.css";


function ItemSummary({ items }) {
  // Group items by name, then count weights left for each name
  const grouped = {};

  items.forEach(({ name, weight }) => {
    if (!grouped[name]) {
      grouped[name] = {};
    }
    grouped[name][weight] = (grouped[name][weight] || 0) + 1;
  });

  return (
    <div className="item-summary">
      <h3>Item Summary by Name and Weight</h3>
      {Object.entries(grouped).map(([name, weights]) => (
        <div key={name} className="summary-section">
          <h4>{name}</h4>
          <ul>
            {Object.entries(weights).map(([weight, count]) => (
              <li key={weight}>
                Weight: {weight} — Left: {count}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default ItemSummary;
