import React, { useState } from "react";
import CustomerForm from "./CustomerForm";
import SearchBar from "./SearchBar";
import PaymentForm from "./PaymentForm";
import PurchaseForm from "./PurchaseForm";
import CustomerListView from "./CustomerListView";
import AddItem from "./AddItem";
import ItemDashboard from "./ItemDashboard";

function PurchaseList({ purchases }) {
  if (!purchases.length) return <p>No purchases yet</p>;

  return (
    <div className="purchase-table-wrapper">
      <table className="purchase-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Item Purchased</th>
            <th>Bill Amount</th>
            <th>Amount Paid</th>
            <th>Due Amount</th>
            <th>Status</th>
            <th>Payment Date</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((p, i) => (
            <tr key={i} className={p.paid ? "paid" : "due"}>
              <td>
                {p.date?.toDate
                  ? p.date.toDate().toLocaleDateString()
                  : new Date(p.date).toLocaleDateString()}
              </td>
              <td>{p.item}</td>
              <td>₹{p.billAmount}</td>
              <td>₹{p.amountPaid || 0}</td>
              <td>₹{p.dueAmount}</td>
              <td>{p.paid ? "Paid" : "Due"}</td>
              <td>
                {p.paymentDate
                  ? p.paymentDate.toDate
                    ? p.paymentDate.toDate().toLocaleDateString()
                    : new Date(p.paymentDate).toLocaleDateString()
                  : "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminDashboard({
  customers,
  selectedCustomer,
  setSelectedCustomer,
  searchCustomers,
  addCustomer,
  updateCustomer,
  addPurchase,
  recordPayment,
  addItem,
  existingNames,
  existingPurities,
  items,
}) {
  const [activeFunc, setActiveFunc] = useState("searchCustomer");
  const [editingCustomer, setEditingCustomer] = useState(null);

  const menuItems = [
    { label: "Add Customer", key: "addCustomer", disabled: false },
    { label: "Search Customer", key: "searchCustomer", disabled: false },
    {
      label: "Record Purchase",
      key: "recordPurchase",
      disabled: !selectedCustomer,
      tooltip: !selectedCustomer ? "Select a customer first" : "",
    },
    {
      label: "Record Payment",
      key: "recordPayment",
      disabled: !selectedCustomer,
      tooltip: !selectedCustomer ? "Select a customer first" : "",
    },
    {
      label: "Update Customer",
      key: "updateCustomer",
      disabled: !selectedCustomer,
      tooltip: !selectedCustomer ? "Select a customer first" : "",
    },
    { label: "Add Item", key: "addItem", disabled: false },
    { label: "View Items", key: "viewItems", disabled: false },
  ];

  const handleEditClick = () => {
    setEditingCustomer(selectedCustomer);
    setActiveFunc("updateCustomer");
  };

  const handleUpdateSubmit = (updatedCustomer) => {
    updateCustomer(updatedCustomer);
    setEditingCustomer(null);
    setSelectedCustomer(updatedCustomer);
    setActiveFunc("searchCustomer");
  };

  const handleCancelUpdate = () => {
    setEditingCustomer(null);
    setActiveFunc("searchCustomer");
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-menu">
        {menuItems.map(({ label, key, disabled, tooltip }) => (
          <button
            key={key}
            className={`dashboard-card ${activeFunc === key ? "active" : ""}`}
            onClick={() => {
              if (!disabled) {
                if (key === "updateCustomer") {
                  handleEditClick();
                } else {
                  setActiveFunc(key);
                  setEditingCustomer(null);
                }
              }
            }}
            type="button"
            disabled={disabled}
            title={tooltip || ""}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {activeFunc === "addCustomer" && (
          <>
            <h2>Add Customer</h2>
            <CustomerForm
              onSubmit={addCustomer}
              submitLabel="Add Customer"
              className="customer-form"
            />
          </>
        )}

        {activeFunc === "searchCustomer" && (
          <>
            <h2>Search Customer</h2>
            <SearchBar onSearch={searchCustomers} className="search-bar" />
            <CustomerListView
              customers={customers}
              onSelect={setSelectedCustomer}
              selectedCustomer={selectedCustomer}
              className="customer-list"
            />

            {selectedCustomer ? (
              <div className="customer-details">
                <h3>
                  {selectedCustomer.name} — Total Due: ₹{selectedCustomer.totalDue}
                </h3>
                <PurchaseList purchases={selectedCustomer.purchases || []} />
              </div>
            ) : (
              <p>Please select a customer to see purchase and payment history.</p>
            )}
          </>
        )}

        {activeFunc === "updateCustomer" && editingCustomer && (
          <>
            <h2>Update Customer</h2>
            <CustomerForm
              initialData={editingCustomer}
              onSubmit={handleUpdateSubmit}
              onCancel={handleCancelUpdate}
              submitLabel="Update Customer"
              className="customer-form"
            />
          </>
        )}

        {activeFunc === "recordPurchase" && selectedCustomer && (
          <>
            <h2>Record Purchase for {selectedCustomer.name}</h2>
            <PurchaseForm
              onAddPurchase={(purchase) => addPurchase(selectedCustomer.id, purchase)}
              className="purchase-form"
            />
          </>
        )}

        {activeFunc === "recordPayment" && selectedCustomer && (
          <>
            <h2>Record Payment for {selectedCustomer.name}</h2>
            <PaymentForm
              purchases={selectedCustomer.purchases || []}
              onRecordPayment={(index, amount, date) =>
                recordPayment(selectedCustomer.id, index, amount, date)
              }
              className="payment-form"
            />
          </>
        )}

        {activeFunc === "addItem" && (
          <>
            <h2>Add New Item</h2>
            <AddItem
              addItem={addItem}
              existingNames={existingNames}
              existingPurities={existingPurities}
            />
          </>
        )}

        {activeFunc === "viewItems" && (
          <>
            <ItemDashboard items={items} />
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
