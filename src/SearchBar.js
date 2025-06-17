import React, { useState, useRef } from "react";
import "./SearchBar.css";

export default function SearchBar({ onSearch }) {
  const [text, setText] = useState("");
  const inputRef = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    onSearch(text.trim());
    if (inputRef.current) inputRef.current.focus();
  };

  const clearSearch = () => {
    setText("");
    onSearch("");
    if (inputRef.current) inputRef.current.focus();
  };

  return (
    <form onSubmit={submit} className="search-bar" noValidate>
      <div className="search-input-wrapper">
        <input
          ref={inputRef}
          type="search"
          placeholder="Search by name, phone, or address..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="search-input"
          aria-label="Search customers"
          spellCheck="false"
          autoComplete="off"
        />
        {text && (
          <button
            type="button"
            className="clear-btn"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>
      <button type="submit" className="search-btn" aria-label="Search">
        🔍
      </button>
    </form>
  );
}
