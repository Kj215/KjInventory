import React, { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, arrayUnion, getDoc, increment as firebaseIncrement } from "firebase/firestore";
import { db } from "../firebase";

import AdminDashboard from "../components/AdminDashboard";
import UserMenu from "../UserMenu";

export default function DashboardPage({ user }) {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState([]);

  useEffect(() => {
    async function fetchItems() {
      const colRef = collection(db, "items");
      const snapshot = await getDocs(colRef);
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(fetchedItems);
    }
    fetchItems();
  }, []);

  const searchCustomers = async (text) => {
    setSearchText(text);
    if (!text.trim()) {
      setCustomers([]);
      setSelectedCustomer(null);
      return;
    }
    setLoading(true);

    const q = collection(db, "customers");
    const snap = await getDocs(q);
    const filtered = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((cust) => {
        const lowerText = text.toLowerCase();
        return (
          (cust.name && cust.name.toLowerCase().includes(lowerText)) ||
          (cust.address && cust.address.toLowerCase().includes(lowerText)) ||
          (cust.phone && cust.phone.toLowerCase().includes(lowerText))
        );
      });
    setCustomers(filtered);

    if (selectedCustomer && filtered.find((c) => c.id === selectedCustomer.id)) {
      setSelectedCustomer(selectedCustomer);
    } else {
      setSelectedCustomer(null);
    }

    setLoading(false);
  };

  const addCustomer = async (data) => {
    try {
      const ref = await addDoc(collection(db, "customers"), {
        ...data,
        totalDue: 0,
        purchases: [],
      });
      if (searchText) searchCustomers(searchText);
      alert("Customer added!");
      return ref.id;
    } catch (e) {
      alert("Error adding customer: " + e.message);
    }
  };

  const addPurchase = async (customerId, purchase) => {
    try {
      const custRef = doc(db, "customers", customerId);
      purchase.dueAmount = purchase.billAmount - purchase.amountPaid;
      purchase.paid = purchase.dueAmount === 0;
      purchase.date = purchase.date ? purchase.date : new Date();

      await updateDoc(custRef, {
        purchases: arrayUnion(purchase),
        totalDue: firebaseIncrement(purchase.dueAmount),
      });

      if (customerId === selectedCustomer?.id) {
        setSelectedCustomer({
          ...selectedCustomer,
          purchases: [...(selectedCustomer.purchases || []), purchase],
          totalDue: (selectedCustomer.totalDue || 0) + purchase.dueAmount,
        });
      }
      alert("Purchase added!");
    } catch (e) {
      alert("Error adding purchase: " + e.message);
    }
  };

  const recordPayment = async (customerId, purchaseIndex, amount, paymentDate) => {
    try {
      const custRef = doc(db, "customers", customerId);
      const customerDoc = await getDoc(custRef);
      const data = customerDoc.data();

      if (!data) throw new Error("Customer data missing");

      let purchases = [...(data.purchases || [])];
      let purchase = purchases[purchaseIndex];

      if (!purchase) throw new Error("Purchase not found");

      const prevPaid = purchase.amountPaid || 0;

      let newAmountPaid = prevPaid + amount;
      let newDueAmount = purchase.billAmount - newAmountPaid;
      if (newDueAmount < 0) newDueAmount = 0;

      purchase.amountPaid = newAmountPaid;
      purchase.dueAmount = newDueAmount;
      purchase.paid = newDueAmount === 0;
      purchase.paymentDate = paymentDate ? paymentDate : new Date();

      purchases[purchaseIndex] = purchase;

      let totalDue = purchases.reduce((acc, p) => acc + (p.dueAmount || 0), 0);

      await updateDoc(custRef, {
        purchases,
        totalDue,
      });

      if (customerId === selectedCustomer?.id) {
        setSelectedCustomer({
          ...selectedCustomer,
          purchases,
          totalDue,
        });
      }
      alert("Payment recorded!");
    } catch (e) {
      alert("Error recording payment: " + e.message);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Komal Jeweller</h1>
        <UserMenu user={user} />
      </header>

      <AdminDashboard
        customers={customers}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
        searchCustomers={searchCustomers}
        addCustomer={addCustomer}
        addPurchase={addPurchase}
        recordPayment={recordPayment}
        items={items}
        loading={loading}
      />
    </div>
  );
}
