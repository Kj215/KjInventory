import React, { useState, useEffect, useRef } from "react";
import "./CustomerForm.css";

export default function CustomerForm({
  initialData = {},
  onSubmit,
  onCancel,
  submitLabel = "Submit",
  className = "",
}) {
  const [name, setName] = useState(initialData.name || "");
  const [address, setAddress] = useState(initialData.address || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [email, setEmail] = useState(initialData.email || "");
  const [description, setDescription] = useState(initialData.description || "");

  // Ref to track previous initialData
  const initialDataRef = useRef(initialData);

  useEffect(() => {
    // Update state only if initialData id changes (i.e., when editing a different customer)
    if (initialData.id !== initialDataRef.current.id) {
      setName(initialData.name || "");
      setAddress(initialData.address || "");
      setPhone(initialData.phone || "");
      setEmail(initialData.email || "");
      setDescription(initialData.description || "");
      initialDataRef.current = initialData;
    }
  }, [initialData]);

  const submit = (e) => {
    e.preventDefault();

    if (!name || !phone) {
      alert("Name and Phone are required");
      return;
    }

    // Prepare data without id when adding a new customer
    const customerData = {
      name,
      address,
      phone,
      email,
      description,
    };

    if (initialData.id) {
      customerData.id = initialData.id;
    }

    onSubmit(customerData);

    // Clear form only if adding new customer (no id)
    if (!initialData.id) {
      setName("");
      setAddress("");
      setPhone("");
      setEmail("");
      setDescription("");
    }
  };

  return (
    <form onSubmit={submit} className={`customer-form ${className}`}>
      <h3>Enter Customer Information</h3>
      <input
        type="text"
        placeholder="Name*"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input-field"
        required
      />
      <input
        type="text"
        placeholder="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        className="input-field"
      />
      <input
        type="tel"
        placeholder="Phone*"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="input-field"
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input-field"
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="input-field"
      />
      <div className="form-buttons">
        <button type="submit" className="submit-btn">
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            className="cancel-btn"
            onClick={onCancel}
            style={{ marginLeft: "10px" }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
