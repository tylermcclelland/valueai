// frontend/src/App.jsx
import React, { useState } from "react";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");

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

  // in App.jsx

return (
  <div className="app-container">
    <div className="card">
      <h1>Value AI</h1>

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


