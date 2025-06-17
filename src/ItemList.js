import React from "react";
import { weightRanges, quantityRanges, quantityToRange } from "./ItemForm";

function ItemList({ items }) {
  if (!items.length) return <p>No items added yet.</p>;

  return (
    <table border="1" cellPadding="6" style={{ marginTop: "1rem", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th>Name</th>
          <th>Weight Range</th>
          <th>Quantity Range</th>
          <th>Purity</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{weightRanges[item.weight]}</td>
            <td>{quantityRanges[quantityToRange(item.quantity)] || item.quantity}</td>
            <td>{item.purity}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ItemList;
