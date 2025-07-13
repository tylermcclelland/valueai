import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import ValueHistoryGraph from './ValueHistoryGraph';
import ForSaleListings from './ForSaleListings';

function App() {
  // State
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [carData, setCarData] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showAnimatedText, setShowAnimatedText] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Effects
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
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  // Handlers
  const handleAction = async () => {
    if (searchTerm.trim()) {
      await findCars();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAction();
    }
  };

  const findCars = async () => {
    if (!searchTerm.trim()) return;
    setIsEstimating(true);
    setError("");
    setCarData(null);

    try {
      const res = await fetch(`${API_URL}/find-cars`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchTerm: searchTerm.trim() }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || `Server error: ${res.status}`);
      }
      const data = await res.json();
      setCarData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch car info.");
    } finally {
      setIsEstimating(false);
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    dragCounter.current = 0;
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setSearchTerm(""); // Clear search term if a file is dropped
      setCarData(null);    // Clear previous results
      setFile(droppedFile);
    }
  };

  // Render
  return (
    <div
      className="app-wrapper"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && <div className="drop-overlay"></div>}
      <div className="gradient-bg" />

      <div className="app-container">
        
        <div className="content-wrapper">
          <h1>Value AI</h1>
          <div className="animated-text-container">
            <p className={`animated-text ${showAnimatedText ? 'visible' : 'hidden'}`}>
              Drag & Drop an image or type to search
            </p>
          </div>
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></svg>
                  )}
                </label>
                <input id="file-upload" type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <div className="search-input-wrapper">
                <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A8 8 0 1 0 10 18zm0-14a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" /></svg>
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
              disabled={(!file && !searchTerm.trim()) || isEstimating}
            >
              {isEstimating ? <div className="loading-spinner"></div> : "Estimate"}
            </button>
          </div>
        </div>
        
        {error && <p className="error-text" style={{color: '#ff8a8a', marginTop: '16px'}}>{error}</p>}

        {carData && (
          <div className="results-container">
            <div className="details-layout">
              <div className="result-box">
                <div className="result-grid">
                  <div className="grid-item"><strong>Make</strong></div>
                  <div className="grid-item">{carData.make}</div>
                  <div className="grid-item"><strong>Model</strong></div>
                  <div className="grid-item">{carData.model}</div>
                  <div className="grid-item"><strong>Year</strong></div>
                  <div className="grid-item">{carData.year}</div>
                  <div className="grid-item"><strong>Value</strong></div>
                  <div className="grid-item">{carData.valueRange}</div>
                </div>
                {carData.description && <p className="description">{carData.description}</p>}
              </div>

              {carData.priceHistoryMonthly && carData.priceHistoryYearly && (
                  <ValueHistoryGraph 
                    monthlyData={carData.priceHistoryMonthly}
                    yearlyData={carData.priceHistoryYearly}
                  />
                )}
            </div>

            {carData.listings && carData.listings.length > 0 && (
                <ForSaleListings listings={carData.listings} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;