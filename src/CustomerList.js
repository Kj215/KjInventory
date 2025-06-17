import React from "react";

export default function CustomerList({ customers = [], onSelect, selectedId }) {
  if (!customers.length) return <p>No customers found</p>;

  return (
    <ul className="customer-list">
      {customers.map((c) => (
        <li
          key={c.id}
          className={`customer-item ${selectedId === c.id ? "selected" : ""}`}
          onClick={() => onSelect(c)}
          role="button"
          tabIndex={0}
          aria-selected={selectedId === c.id}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelect(c);
            }
          }}
          style={{ cursor: "pointer" }}
        >
          {c.name} ({c.phone}) - Due: ₹{c.totalDue}
        </li>
      ))}
    </ul>
  );
}
