import React, { useState, useRef, useEffect } from "react";
import { useCarFinder } from './hooks/useCarFinder';
import "./App.css";
import ValueHistoryGraph from './ValueHistoryGraph';
import ForSaleListings from './ForSaleListings';

function App() {
  // State
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showAnimatedText, setShowAnimatedText] = useState(true);

  // Custom hook for API calls
  const { carData, isEstimating, error, findCarsByTerm } = useCarFinder();

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
      await findCarsByTerm(searchTerm);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAction();
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
      setSearchTerm("");
      // NOTE: setCarData is now controlled by the useCarFinder hook.
      // To clear data, a function would need to be exposed from the hook.
      setFile(droppedFile);
    }
  };

  // --- NEW FUNCTION ---
  // This function transforms the data from the API to the format the new graph component expects.
  // It converts the 'name' key (e.g., "January" or "2024") into a 'date' key with a timestamp value.
  const transformGraphData = (dataArray = []) => {
    if (!dataArray || dataArray.length === 0) return [];
    
    // A more robust check to see if the data is yearly.
    const isYearly = dataArray[0].name.length === 4 && !isNaN(parseInt(dataArray[0].name, 10));
    const currentYear = new Date().getFullYear();

    return dataArray.map(item => {
      let dateObject;
      if (isYearly) {
        // This part for yearly data works well.
        dateObject = new Date(item.name, 0, 1);
      } else {
        // This part is improved to handle monthly data when 'name' is a number (e.g., "1", "2").
        const monthIndex = parseInt(item.name, 10) - 1; // JS months are 0-11, so "1" becomes 0.
        
        // Check if the month number is valid (0-11)
        if (monthIndex >= 0 && monthIndex < 12) {
          dateObject = new Date(currentYear, monthIndex, 1);
        } else {
          // If the data format is unexpected, return null to filter it out later.
          return { date: null, value: item.value };
        }
      }
      return {
        date: dateObject.getTime(), // The graph needs a timestamp
        value: item.value
      };
    }).filter(item => item.date !== null); // Remove any entries that failed to parse.
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
                  // --- MODIFIED SECTION ---
                  // Use the new transformation function before passing data to the graph component.
                  <ValueHistoryGraph 
                    monthlyData={transformGraphData(carData.priceHistoryMonthly)}
                    yearlyData={transformGraphData(carData.priceHistoryYearly)}
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