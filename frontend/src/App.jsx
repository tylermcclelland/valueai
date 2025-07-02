// frontend/src/App.jsx
import React, { useState } from "react";
import "./App.css"

function App() {
  // file upload
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");

  // search bar
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResult, setSearchResult] = useState(null);  
  const API_URL = import.meta.env.VITE_API_URL;

  // Image upload handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select an image.");

    const formData = new FormData();
    formData.append("image", file);

    try {
      const API_URL = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data.value || "Unknown");
    } catch {
      setResult("Error estimating car value.");
    }
  };

  // Search bar handler (proxy through backend)
  const handleFindCars = async () => {
    if (!searchTerm.trim()) return;
    setLoadingSearch(true);
    setSearchError("");
    setSearchResult(null);

    try {
      const res = await fetch(`${API_URL}/find-cars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchTerm: searchTerm.trim() }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const parsed = await res.json();
      setSearchResult(parsed);
    } catch (err) {
      console.error("Failed to fetch car info:", err);
      setSearchError("Failed to fetch car info.");
    } finally {
      setLoadingSearch(false);
    }
  };

  // in App.jsx
return (
  <div className="app-container">
    <div className="card">
      <h1>Value AI</h1>
      {/* Search bar UI */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder={`Enter Make, Model, and Year`}     
            className="search-input"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
            }}
          />
          <button className="go-button" onClick={handleFindCars}>Find Cars</button>
        </div>
      </div>

      {loadingSearch && <p>Loading...</p>}
      {searchError && <p className="error-text">{searchError}</p>}
      {searchResult && (
        <div className="result-box">
          <h3>Search Result</h3>
          <p><strong>Make:</strong> {searchResult.make}</p>
          <p><strong>Model:</strong> {searchResult.model}</p>
          <p><strong>Year:</strong> {searchResult.year}</p>
          <p><strong>Estimated Value:</strong> {searchResult.valueRange}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-controls">
          <div className="file-input-wrapper">
            <span className="file-input-trigger">
              {file ? file.name : "Upload Image"}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={!file}
          >
            Get Value
          </button>
        </div>
      </form>

      {result && (
        <div className="result-box">
          <strong>Result:</strong> {result}
        </div>
      )}
    </div>
  </div>
);

}

export default App;


