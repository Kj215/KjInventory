import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from "firebase/firestore";

function App() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Add customer form state
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerAddress, setNewCustomerAddress] = useState("");
  const [newCustomerDues, setNewCustomerDues] = useState("");

  // Add purchase record form state
  const [recordCustomerId, setRecordCustomerId] = useState("");
  const [items, setItems] = useState([
    { itemName: "", description: "", quantity: 1, price: 0 },
  ]);
  const [amountPaid, setAmountPaid] = useState("");
  const [recordDate, setRecordDate] = useState("");

  // Separate payment section state
  const [paymentCustomerId, setPaymentCustomerId] = useState("");
  const [paymentRecords, setPaymentRecords] = useState([]); // unpaid records of selected customer
  const [selectedPayments, setSelectedPayments] = useState({}); // recordId: amount to pay
  const [paymentAmount, setPaymentAmount] = useState("");

  // Search
  const [searchTerm, setSearchTerm] = useState("");

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(true);
      if (currentUser) {
        const tokenResult = await currentUser.getIdTokenResult();
        setIsAdmin(!!tokenResult.claims.admin);
        if (tokenResult.claims.admin) {
          const querySnapshot = await getDocs(collection(db, "customers"));
          const custList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCustomers(custList);
          setFilteredCustomers([]);
        } else {
          setCustomers([]);
          setFilteredCustomers([]);
        }
      } else {
        setIsAdmin(false);
        setCustomers([]);
        setFilteredCustomers([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Refresh customers list from firestore
  async function refreshCustomers() {
    const querySnapshot = await getDocs(collection(db, "customers"));
    const custList = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setCustomers(custList);
    setFilteredCustomers([]);
  }

  // Login
  const handleLogin = (e) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password).catch((err) =>
      alert(err.message)
    );
  };
  function toDate(timestamp) {
    if (!timestamp) return null;
  
    // If it's a Firestore Timestamp object
    if (timestamp.toDate) {
      return timestamp.toDate();
    }
  
    // If it's already a JS Date object
    if (timestamp instanceof Date) {
      return timestamp;
    }
  
    // If it's a timestamp object with seconds field (common in Firestore export)
    if (timestamp.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
  
    // Otherwise, try creating a Date (fallback)
    const date = new Date(timestamp);
    return isNaN(date) ? null : date;
  }

  // Logout
  const handleLogout = () => {
    signOut(auth);
  };

  // Add new customer
  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (
      !newCustomerName ||
      !newCustomerEmail ||
      !newCustomerPhone ||
      newCustomerDues === ""
    ) {
      alert("Fill all required fields");
      return;
    }
    try {
      await addDoc(collection(db, "customers"), {
        name: newCustomerName,
        email: newCustomerEmail,
        phone: newCustomerPhone,
        address: newCustomerAddress,
        dues: Number(newCustomerDues),
        records: [],
        createdAt: new Date(),
      });
      alert("Customer added");
      await refreshCustomers();
      setNewCustomerName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
      setNewCustomerAddress("");
      setNewCustomerDues("");
    } catch (error) {
      alert("Error adding customer: " + error.message);
    }
  };

  // Purchase record item handlers
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    if (field === "quantity" || field === "price") {
      updatedItems[index][field] = Number(value) || 0;
    } else {
      updatedItems[index][field] = value;
    }
    setItems(updatedItems);
  };

  const addItemRow = () => {
    setItems([...items, { itemName: "", description: "", quantity: 1, price: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
  };

  const calculateTotalBill = () =>
    items.reduce((sum, item) => sum + (item.quantity * item.price || 0), 0);

  // Add purchase record with amount paid, apply overflow payment to other dues
  const handleAddRecord = async (e) => {
    e.preventDefault();
    if (!recordCustomerId) {
      alert("Select a customer");
      return;
    }
    if (items.some((item) => !item.itemName || item.quantity <= 0 || item.price < 0)) {
      alert("Fill all item fields correctly");
      return;
    }
    if (amountPaid === "" || isNaN(Number(amountPaid)) || Number(amountPaid) < 0) {
      alert("Enter a valid amount paid");
      return;
    }

    const totalBill = calculateTotalBill();
    const paidAmount = Number(amountPaid);
    const todayDate = recordDate ? new Date(recordDate) : new Date();

    try {
      const customerDocRef = doc(db, "customers", recordCustomerId);
      const customer = customers.find((c) => c.id === recordCustomerId);
      if (!customer) {
        alert("Customer not found");
        return;
      }

      // Clone records or empty array
      const records = customer.records ? [...customer.records] : [];

      // New purchase record with paid amount specific to that record
      // Start with balance = totalBill - paidAmount (paidAmount can't exceed totalBill)
      const firstRecordPaidAmount = Math.min(paidAmount, totalBill);
      const firstRecordBalance = totalBill - firstRecordPaidAmount;

      const newRecord = {
        items,
        totalBill,
        amountPaid: firstRecordPaidAmount,
        balance: firstRecordBalance,
        date: todayDate,
        paid: firstRecordBalance === 0,
      };

      records.push(newRecord);

      let remainingPayment = paidAmount - firstRecordPaidAmount; // overflow payment

      // Sort existing records (excluding the newly added one) by date asc
      const existingRecords = records.slice(0, -1).filter(r => !r.paid);
      existingRecords.sort((a, b) => {
        const dateA = a.date?.seconds ? a.date.seconds : new Date(a.date).getTime();
        const dateB = b.date?.seconds ? b.date.seconds : new Date(b.date).getTime();
        return dateA - dateB;
      });

      // Apply overflow payment to other unpaid existing records FIFO
      for (let rec of existingRecords) {
        if (remainingPayment <= 0) break;
        if (rec.paid) continue;
        const needed = rec.balance;
        if (remainingPayment >= needed) {
          rec.amountPaid += needed;
          rec.balance = 0;
          rec.paid = true;
          remainingPayment -= needed;
        } else {
          rec.amountPaid += remainingPayment;
          rec.balance -= remainingPayment;
          rec.paid = false;
          remainingPayment = 0;
        }
      }

      // Update records array with updated existingRecords and new record
      // Combine updated existingRecords + new record + other paid records
      const updatedRecords = [
        ...existingRecords,
        newRecord,
        ...records.filter((r) => r.paid && r !== newRecord),
      ];

      // Calculate new dues (sum of balances of all unpaid records)
      const newDues = updatedRecords.reduce((sum, r) => sum + (r.balance || 0), 0);

      await updateDoc(customerDocRef, {
        records: updatedRecords,
        dues: newDues,
      });

      alert("Purchase record added with payments applied.");

      await refreshCustomers();

      // Reset form
      setRecordCustomerId("");
      setItems([{ itemName: "", description: "", quantity: 1, price: 0 }]);
      setAmountPaid("");
      setRecordDate("");
    } catch (error) {
      alert("Error adding purchase record: " + error.message);
    }
  };

  // SEARCH
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredCustomers([]);
    } else {
      const lowerTerm = searchTerm.trim().toLowerCase();
      const filtered = customers.filter(
        (cust) =>
          (cust.phone && cust.phone.toLowerCase().includes(lowerTerm)) ||
          (cust.name && cust.name.toLowerCase().includes(lowerTerm)) ||
          (cust.address && cust.address.toLowerCase().includes(lowerTerm))
      );
      setFilteredCustomers(filtered);
    }
  };

  // Payment Section: when customer selected, get unpaid purchase records
  useEffect(() => {
    if (!paymentCustomerId) {
      setPaymentRecords([]);
      setSelectedPayments({});
      setPaymentAmount("");
      return;
    }
    const cust = customers.find((c) => c.id === paymentCustomerId);
    if (!cust) {
      setPaymentRecords([]);
      setSelectedPayments({});
      setPaymentAmount("");
      return;
    }
    // Unpaid records only, sorted by date ascending
    const unpaid = (cust.records || [])
      .filter((r) => !r.paid && r.balance > 0)
      .sort((a, b) => {
        const dateA = a.date?.seconds ? a.date.seconds : new Date(a.date).getTime();
        const dateB = b.date?.seconds ? b.date.seconds : new Date(b.date).getTime();
        return dateA - dateB;
      });
    setPaymentRecords(unpaid);
    setSelectedPayments({});
    setPaymentAmount("");
  }, [paymentCustomerId, customers]);

  // Handle selecting payment amount per record in payment section
  const handlePaymentRecordChange = (recordIndex, value) => {
    const val = Number(value);
    if (isNaN(val) || val < 0) return;

    const record = paymentRecords[recordIndex];
    if (!record) return;

    // Cannot pay more than record's balance
    if (val > record.balance) {
      alert(`Cannot pay more than balance (${record.balance.toFixed(2)}) for this record.`);
      return;
    }

    setSelectedPayments((prev) => ({
      ...prev,
      [recordIndex]: val,
    }));
  };

  // Handle submit payment to selected purchase records
  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!paymentCustomerId) {
      alert("Select a customer for payment");
      return;
    }
    if (paymentRecords.length === 0) {
      alert("No unpaid purchase records for this customer");
      return;
    }

    // Sum total payment from selectedPayments
    const totalSelectedPayment = Object.values(selectedPayments).reduce(
      (acc, val) => acc + (Number(val) || 0),
      0
    );

    if (totalSelectedPayment <= 0) {
      alert("Enter payment amount(s) for at least one purchase record.");
      return;
    }

    try {
      const customerDocRef = doc(db, "customers", paymentCustomerId);
      const cust = customers.find((c) => c.id === paymentCustomerId);
      if (!cust) {
        alert("Customer not found");
        return;
      }

      const records = [...(cust.records || [])];

      // Apply payments to records (match records by content - date+totalBill+balance)
      // We use index because we have paymentRecords array subset of records, with matching order
      for (const [indexStr, paymentVal] of Object.entries(selectedPayments)) {
        const idx = Number(indexStr);
        if (isNaN(idx)) continue;
        const payAmount = Number(paymentVal);
        if (payAmount <= 0) continue;

        // Find this record in main records array by matching key properties:
        // (We assume paymentRecords comes from records filtered unpaid in same order)
        const payRec = paymentRecords[idx];
        // Find index of this record in full records array (match by date + totalBill + balance roughly)
        const recIndex = records.findIndex(
          (r) =>
            toDate(r.date).toISOString() === toDate(payRec.date).toISOString() &&
            r.totalBill === payRec.totalBill &&
            r.balance === payRec.balance &&
            !r.paid
        );
        if (recIndex === -1) continue;

        const rec = records[recIndex];
        if (payAmount > rec.balance) {
          alert(
            `Payment for record ${idx + 1} exceeds balance (${rec.balance.toFixed(
              2
            )}).`
          );
          return;
        }

        rec.amountPaid += payAmount;
        rec.balance -= payAmount;
        rec.paid = rec.balance <= 0;
        records[recIndex] = rec;
      }

      // Recalculate dues = sum of balances of all unpaid records
      const newDues = records.reduce((sum, r) => sum + (r.balance || 0), 0);

      await updateDoc(customerDocRef, {
        records,
        dues: newDues,
      });

      alert("Payments recorded successfully");
      await refreshCustomers();

      // Reset payment section form
      setPaymentCustomerId("");
      setPaymentRecords([]);
      setSelectedPayments({});
      setPaymentAmount("");
    } catch (error) {
      alert("Error recording payment: " + error.message);
    }
  };

  if (loading) return <div>Loading...</div>;

  if (!user)
    return (
      <div>
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <br />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <br />
          <button type="submit">Login</button>
        </form>
      </div>
    );

  if (!isAdmin)
    return (
      <div>
        <h2>Access denied. Only admins allowed.</h2>
        <button onClick={handleLogout}>Logout</button>
      </div>
    );

  return (
    <div style={{ padding: 20 }}>
      <h1>Customer Purchase & Payment Management</h1>
      <button onClick={handleLogout}>Logout</button>

      {/* Search */}
      <div style={{ marginTop: 20 }}>
        <input
          type="text"
          placeholder="Search by phone, name, or address"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
          style={{ width: 300 }}
        />
        <button onClick={handleSearch} style={{ marginLeft: 10 }}>
          Search
        </button>
      </div>

      {/* Customer display */}
      <div style={{ marginTop: 20 }}>
        {filteredCustomers.length === 0 ? (
          <p>No customers to display. Please search to find customers.</p>
        ) : (
          filteredCustomers.map((cust) => (
            <div
              key={cust.id}
              style={{
                border: "1px solid #ccc",
                marginBottom: 20,
                padding: 10,
                borderRadius: 5,
              }}
            >
              <h3>
                {cust.name} - {cust.phone} - {cust.address || "No address"}
              </h3>
              <p>Email: {cust.email}</p>
              <p>
                Total Dues: ₹{cust.dues ? cust.dues.toFixed(2) : "0.00"}
              </p>

              {/* Purchase Records */}
              <h4>Purchase Records:</h4>
              {cust.records && cust.records.length > 0 ? (
                <table
                  border="1"
                  cellPadding="5"
                  style={{ width: "100%", borderCollapse: "collapse" }}
                >
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Items (Name, Qty, Price)</th>
                      <th>Total Bill</th>
                      <th>Amount Paid</th>
                      <th>Balance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cust.records
                      .slice()
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((record, idx) => {
                        const dateObj = new toDate(record.date);
                        return (
                          <tr
                            key={idx}
                            style={{
                              backgroundColor: record.paid
                                ? "#d4edda"
                                : "#f8d7da",
                            }}
                          >
                            <td>{dateObj.toLocaleDateString()}</td>
                            <td>
                              {record.items
                                .map(
                                  (item) =>
                                    `${item.itemName} (Qty: ${item.quantity}, ₹${item.price.toFixed(
                                      2
                                    )})`
                                )
                                .join(", ")}
                            </td>
                            <td>₹{record.totalBill.toFixed(2)}</td>
                            <td>₹{record.amountPaid.toFixed(2)}</td>
                            <td>₹{record.balance.toFixed(2)}</td>
                            <td>{record.paid ? "Paid" : "Due"}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              ) : (
                <p>No purchase records.</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add new customer */}
      <div style={{ marginTop: 40 }}>
        <h3>Add New Customer</h3>
        <form onSubmit={handleAddCustomer}>
          <input
            type="text"
            placeholder="Name"
            value={newCustomerName}
            onChange={(e) => setNewCustomerName(e.target.value)}
            required
          />
          <br />
          <input
            type="email"
            placeholder="Email"
            value={newCustomerEmail}
            onChange={(e) => setNewCustomerEmail(e.target.value)}
            required
          />
          <br />
          <input
            type="text"
            placeholder="Phone"
            value={newCustomerPhone}
            onChange={(e) => setNewCustomerPhone(e.target.value)}
            required
          />
          <br />
          <input
            type="text"
            placeholder="Address"
            value={newCustomerAddress}
            onChange={(e) => setNewCustomerAddress(e.target.value)}
          />
          <br />
          <input
            type="number"
            placeholder="Initial Dues (0 if none)"
            value={newCustomerDues}
            onChange={(e) => setNewCustomerDues(e.target.value)}
            min="0"
            required
          />
          <br />
          <button type="submit">Add Customer</button>
        </form>
      </div>

      {/* Add purchase record */}
      <div style={{ marginTop: 40 }}>
        <h3>Add Purchase Record and Payment</h3>
        <form onSubmit={handleAddRecord}>
          <select
            value={recordCustomerId}
            onChange={(e) => setRecordCustomerId(e.target.value)}
            required
          >
            <option value="">Select Customer</option>
            {customers.map((cust) => (
              <option key={cust.id} value={cust.id}>
                {cust.name} ({cust.phone})
              </option>
            ))}
          </select>
          <br />
          <h4>Purchase Items</h4>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                marginBottom: "10px",
                borderRadius: "5px",
                border: "1px solid #ccc",
                padding: "10px",
              }}
            >
              <input
                type="text"
                placeholder="Item Name"
                value={item.itemName}
                onChange={(e) =>
                  handleItemChange(index, "itemName", e.target.value)
                }
                required
              />
              <br />
              <input
                type="text"
                placeholder="Description"
                value={item.description}
                onChange={(e) =>
                  handleItemChange(index, "description", e.target.value)
                }
              />
              <br />
              <input
                type="number"
                placeholder="Quantity"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(index, "quantity", e.target.value)
                }
                min="1"
                required
              />
              <br />
              <input
                type="number"
                placeholder="Price per unit"
                value={item.price}
                onChange={(e) =>
                  handleItemChange(index, "price", e.target.value)
                }
                min="0"
                step="0.01"
                required
              />
              <br />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItemRow(index)}
                  style={{ marginTop: "5px", color: "red" }}
                >
                  Remove Item
                </button>
              )}
            </div>
          ))}

          <button type="button" onClick={addItemRow}>
            + Add Another Item
          </button>

          <br />
          <h4>Total Bill: ₹{calculateTotalBill().toFixed(2)}</h4>

          <input
            type="number"
            placeholder="Amount Paid Today (for this purchase)"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            required
            min="0"
            max={calculateTotalBill()}
          />
          <br />
          <input
            type="date"
            placeholder="Date of Purchase / Payment (optional)"
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
          />
          <br />
          <button type="submit">Add Purchase Record</button>
        </form>
      </div>

      {/* Separate payment section */}
      <div style={{ marginTop: 40 }}>
        <h3>Make Payment for Existing Dues</h3>
        <form onSubmit={handleSubmitPayment}>
          <select
            value={paymentCustomerId}
            onChange={(e) => setPaymentCustomerId(e.target.value)}
          >
            <option value="">Select Customer</option>
            {customers.map((cust) => (
              <option key={cust.id} value={cust.id}>
                {cust.name} ({cust.phone})
              </option>
            ))}
          </select>
          <br />
          {paymentRecords.length === 0 ? (
            <p>No unpaid purchase records for this customer.</p>
          ) : (
            <>
              <table
                border="1"
                cellPadding="5"
                style={{ width: "100%", marginTop: 10, borderCollapse: "collapse" }}
              >
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Date</th>
                    <th>Total Bill</th>
                    <th>Balance</th>
                    <th>Payment Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentRecords.map((rec, idx) => {
                    const dateObj = toDate(rec.date);
                    return (
                      <tr key={idx}>
                        <td>{idx + 1}</td>
                        <td>{dateObj.toLocaleDateString()}</td>
                        <td>₹{rec.totalBill.toFixed(2)}</td>
                        <td>₹{rec.balance.toFixed(2)}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={rec.balance}
                            step="0.01"
                            value={selectedPayments[idx] ?? ""}
                            onChange={(e) =>
                              handlePaymentRecordChange(idx, e.target.value)
                            }
                            placeholder="0"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button type="submit" style={{ marginTop: 10 }}>
                Submit Payment
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default App;
