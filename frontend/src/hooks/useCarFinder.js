import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useCarFinder() {
  const [carData, setCarData] = useState(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState("");

  const findCarsByTerm = async (searchTerm) => {
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

      // --- NEW CODE STARTS HERE ---
      // This part saves the successful search term to the browser's local storage.
      try {
        const term = searchTerm.trim();
        // 1. Get current search history from localStorage, or start with an empty array.
        const recents = JSON.parse(localStorage.getItem('recentSearches')) || [];
        
        // 2. Remove the new search term if it already exists to avoid duplicates and move it to the top.
        const filteredRecents = recents.filter(item => item !== term);

        // 3. Add the new search term to the beginning of the array.
        const newRecents = [term, ...filteredRecents];
        
        // 4. Save the updated array (we'll keep the 5 most recent) back to localStorage.
        localStorage.setItem('recentSearches', JSON.stringify(newRecents.slice(0, 5)));

      } catch (storageError) {
        console.error("Failed to save to localStorage", storageError);
      }
      // --- NEW CODE ENDS HERE ---

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch car info.");
    } finally {
      setIsEstimating(false);
    }
  };

  return { carData, isEstimating, error, findCarsByTerm };
}