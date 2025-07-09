// frontend/src/App.jsx
import React, { useState, useRef, useEffect } from "react";
import "./App.css";

function App() {
  // ── State Hooks ─────────────────────────────────────────────────────────
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isEstimating, setIsEstimating] = useState(false);
  const dragCounter = useRef(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const [showAnimatedText, setShowAnimatedText] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;

  // ── Effects ─────────────────────────────────────────────────────────────
  useEffect(() => {
    let interval;
    if (!file && !searchTerm.trim()) {
      interval = setInterval(() => {
        setShowAnimatedText((prev) => !prev);
      }, 5000);
    } else {
      setShowAnimatedText(false);
    }

    return () => clearInterval(interval);
  }, [file, searchTerm]);

  useEffect(() => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleAction = async () => {
    if (file) {
      await estimateValue();
    } else if (searchTerm.trim()) {
      await findCars();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAction();
    }
  };

  const estimateValue = async () => {
    if (!file) return;
    setIsEstimating(true);
    setResult(null); // Clear previous results
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await fetch(`${API_URL}/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`status: ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setSearchError("Error estimating car value.");
    } finally {
      setIsEstimating(false);
    }
  };

  const findCars = async () => {
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
      if (!res.ok) throw new Error(`status: ${res.status}`);
      setSearchResult(await res.json());
    } catch (err) {
      console.error(err);
      setSearchError("Failed to fetch car info.");
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="app-wrapper"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && <div className="drop-overlay"></div>}
      
      {/* 1. Gradient backdrop */}
      <div className="gradient-bg" />
  
      {/* 2. Main container */}
      <div className="app-container">
        <div className="content-wrapper">
          {/* 2.1.1. Title */}
          <h1>Value AI</h1>
          <div className="animated-text-container">
            <p className={`animated-text ${showAnimatedText ? 'visible' : 'hidden'}`}>
              Drag & Drop an image or type to search
            </p>
          </div>
  
          {/* 2.2. Main action area */}
          <div className="main-action-area">
            <div 
              className={`action-bar ${isSearchActive ? 'search-active' : ''}`}
              onMouseEnter={() => setIsSearchActive(true)}
              onMouseLeave={() => !isInputFocused && setIsSearchActive(false)}
            >
              <div className="file-input-wrapper">
                <label htmlFor="file-upload" className="file-upload-label">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="image-preview" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                  )}
                </label>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </div>
              <div className="search-input-wrapper">
                <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A8 8 0 1 0 10 18zm0-14a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" />
                </svg>
                <input
                  type="text"
                  placeholder="Enter Make, Model, and Year"
                  className="search-input"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  onBlur={() => setIsInputFocused(false)}
                  onKeyDown={handleKeyDown}
                  disabled={!!file}
                />
              </div>
            </div>
            <button
              className="estimate-button"
              onClick={handleAction}
              disabled={(!file && !searchTerm.trim()) || loadingSearch || isEstimating}
            >
              {loadingSearch || isEstimating ? (
                <div className="loading-spinner"></div>
              ) : (
                "Estimate"
              )}
            </button>
          </div>
  
          {/* 2.3. Search feedback */}
          {searchError && <p className="error-text">{searchError}</p>}
          {searchResult && (
            <div className="result-box">
              <div className="result-grid">
                <div className="grid-item"><strong>Make</strong></div>
                <div className="grid-item">{searchResult.make}</div>
                <div className="grid-item"><strong>Model</strong></div>
                <div className="grid-item">{searchResult.model}</div>
                <div className="grid-item"><strong>Year</strong></div>
                <div className="grid-item">{searchResult.year}</div>
                <div className="grid-item"><strong>Value</strong></div>
                <div className="grid-item">{searchResult.valueRange}</div>
                <div className="grid-item"><strong>Engine</strong></div>
                <div className="grid-item">{searchResult.engine}</div>
                <div className="grid-item"><strong>Horsepower</strong></div>
                <div className="grid-item">{searchResult.horsepower}</div>
                <div className="grid-item"><strong>Drivetrain</strong></div>
                <div className="grid-item">{searchResult.drivetrain}</div>
              </div>
              <p className="description">{searchResult.description}</p>
            </div>
          )}
  
          {/* 2.4. Upload result display */}
          {result && (
            <div className="result-box">
              {previewUrl && <img src={previewUrl} alt="Uploaded car" className="result-image" />}
              <div className="result-grid">
                <div className="grid-item"><strong>Make</strong></div>
                <div className="grid-item">{result.make}</div>
                <div className="grid-item"><strong>Model</strong></div>
                <div className="grid-item">{result.model}</div>
                <div className="grid-item"><strong>Year</strong></div>
                <div className="grid-item">{result.year}</div>
                <div className="grid-item"><strong>Value</strong></div>
                <div className="grid-item">{result.valueRange}</div>
                <div className="grid-item"><strong>Engine</strong></div>
                <div className="grid-item">{result.engine}</div>
                <div className="grid-item"><strong>Horsepower</strong></div>
                <div className="grid-item">{result.horsepower}</div>
                <div className="grid-item"><strong>Drivetrain</strong></div>
                <div className="grid-item">{result.drivetrain}</div>
              </div>
              <p className="description">{result.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
