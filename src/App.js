import React, { useEffect, useState } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  arrayUnion,
  query,
  where,
  getDoc,
  increment as firebaseIncrement,
} from "firebase/firestore";

import "./App.css";
import LoginPage from "./LoginPage";
import AdminDashboard from "./AdminDashboard";
import UserMenu from "./UserMenu";

function App() {
  const [user, setUser] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);

  const [items, setItems] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setCustomers([]);
        setSelectedCustomer(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchItems() {
      const colRef = collection(db, "items");
      const snapshot = await getDocs(colRef);
      setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }
    fetchItems();
  }, []);

  const uniqueNames = [...new Set(items.map((item) => item.name).filter(Boolean))];
  const uniquePurities = [...new Set(items.map((item) => item.purity).filter(Boolean))];

  const getWeightRangeFromWeight = (weight) => {
    if (!weight || isNaN(weight)) return null;
    const min = Math.floor(weight);
    const max = min + 1;
    return `${min}-${max}`;
  };

  const addItem = async (itemData) => {
    try {
      const colRef = collection(db, "items");
      const weightRange = getWeightRangeFromWeight(itemData.weight);
      if (!weightRange) throw new Error("Invalid weight");

      const q = query(
        colRef,
        where("name", "==", itemData.name),
        where("purity", "==", itemData.purity),
        where("weightRange", "==", weightRange)
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];
        const existingItem = docSnap.data();
        await updateDoc(doc(db, "items", docSnap.id), {
          quantity: (existingItem.quantity || 0) + 1,
        });
        alert("Item quantity incremented!");
      } else {
        await addDoc(colRef, {
          name: itemData.name,
          purity: itemData.purity,
          weightRange,
          weight: Math.floor(itemData.weight),
          quantity: 1,
        });
        alert("New item added!");
      }

      // Refresh items after adding or updating
      const updatedSnapshot = await getDocs(colRef);
      setItems(updatedSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      alert("Error adding item: " + error.message);
    }
  };

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

    setSelectedCustomer((prevSelected) =>
      filtered.find((c) => c.id === prevSelected?.id) || null
    );

    setLoading(false);
  };

  const addCustomer = async (data) => {
    try {
      const ref = await addDoc(collection(db, "customers"), {
        ...data,
        totalDue: 0,
        purchases: [],
      });
      if (searchText) await searchCustomers(searchText);
      alert("Customer added!");
      return ref.id;
    } catch (e) {
      alert("Error adding customer: " + e.message);
    }
  };

  const updateCustomer = async (data) => {
    if (!data.id) {
      alert("Customer ID is missing");
      return;
    }
    try {
      const custRef = doc(db, "customers", data.id);
      await updateDoc(custRef, {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        description: data.description,
      });

      setCustomers((prev) =>
        prev.map((cust) => (cust.id === data.id ? { ...cust, ...data } : cust))
      );

      if (selectedCustomer?.id === data.id) {
        setSelectedCustomer((prev) => ({ ...prev, ...data }));
      }

      alert("Customer updated!");
    } catch (e) {
      alert("Error updating customer: " + e.message);
    }
  };

  const addPurchase = async (customerId, purchase) => {
    try {
      const custRef = doc(db, "customers", customerId);
      purchase.dueAmount = purchase.billAmount - purchase.amountPaid;
      purchase.paid = purchase.dueAmount === 0;
      purchase.date = purchase.date || new Date();

      await updateDoc(custRef, {
        purchases: arrayUnion(purchase),
        totalDue: firebaseIncrement(purchase.dueAmount),
      });

      if (customerId === selectedCustomer?.id) {
        setSelectedCustomer((prev) => ({
          ...prev,
          purchases: [...(prev.purchases || []), purchase],
          totalDue: (prev.totalDue || 0) + purchase.dueAmount,
        }));
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
      const newAmountPaid = prevPaid + amount;
      let newDueAmount = purchase.billAmount - newAmountPaid;
      if (newDueAmount < 0) newDueAmount = 0;

      purchase = {
        ...purchase,
        amountPaid: newAmountPaid,
        dueAmount: newDueAmount,
        paid: newDueAmount === 0,
        paymentDate: paymentDate || new Date(),
      };

      purchases[purchaseIndex] = purchase;

      const totalDue = purchases.reduce((acc, p) => acc + (p.dueAmount || 0), 0);

      await updateDoc(custRef, { purchases, totalDue });

      if (customerId === selectedCustomer?.id) {
        setSelectedCustomer((prev) => ({ ...prev, purchases, totalDue }));
      }
      alert("Payment recorded!");
    } catch (e) {
      alert("Error recording payment: " + e.message);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <LoginPage />;

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
        updateCustomer={updateCustomer}
        addPurchase={addPurchase}
        recordPayment={recordPayment}
        items={items}
        addItem={addItem}
        existingNames={uniqueNames}
        existingPurities={uniquePurities}
      />
    </div>
  );
}

export default App;
