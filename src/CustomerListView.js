import React from "react";
import "./CustomerListView.css";

export default function CustomerListView({ customers, onSelect, selectedCustomer }) {
  if (!customers.length) return <p>No customers found.</p>;

  return (
    <ul className="customer-list-view">
      {customers.map((c) => (
        <li
          key={c.id}
          onClick={() => onSelect(c)}
          className={`customer-list-item ${
            selectedCustomer && selectedCustomer.id === c.id ? "selected" : ""
          }`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") onSelect(c);
          }}
        >
          <div>
            <strong>{c.name}</strong> — Due: ₹{c.totalDue || 0}
          </div>
          <div className="customer-subinfo">
            {c.phone} | {c.address || "No address"}
          </div>
        </li>
      ))}
    </ul>
  );
}
