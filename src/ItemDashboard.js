import React, { useState, useEffect } from "react";
import "./ItemDashboard.css";

function ItemDashboard({ items }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredItems, setFilteredItems] = useState(items);

  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  const handleSearch = () => {
    const lowerTerm = searchTerm.toLowerCase().trim();
    if (!lowerTerm) {
      setFilteredItems(items);
      return;
    }

    const filtered = items.filter(
      (item) =>
        (item.name && item.name.toLowerCase().includes(lowerTerm)) ||
        (item.purity && item.purity.toLowerCase().includes(lowerTerm))
    );
    setFilteredItems(filtered);
  };

  // Show only first 10 items
  const visibleItems = filteredItems.slice(0, 10);

  return (
    <div className="item-dashboard">
      <h2>Items Inventory</h2>

      <div className="search-bar">
        <input
          type="text"
          placeholder="Search by name or purity..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {filteredItems.length === 0 ? (
        <p>No items found.</p>
      ) : (
        <table className="item-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Purity</th>
              <th>Weight Range</th>
              <th>Quantity</th>
            </tr>
          </thead>
        </table>
      )}

      {/* Scrollable div containing only first 10 rows */}
      <div className="item-table-wrapper">
        <table className="item-table">
          <tbody>
            {visibleItems.map(({ id, name, purity, weightRange, quantity }) => (
              <tr key={id}>
                <td>{name}</td>
                <td>{purity}</td>
                <td>{weightRange}</td>
                <td>{quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ItemDashboard;
