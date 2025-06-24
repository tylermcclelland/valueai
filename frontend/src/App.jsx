import React, { useState } from 'react';
import './index.css';

function App() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Please select an image.');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const API_URL = import.meta.env.VITE_API_URL
      const res = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(`Estimated value: $${data.value ?? 'unknown'}`);
    } catch (err) {
      console.error(err);
      setResult('Error estimating car value.');
    }
  };

  return (
    <div className="container">
      <h1>Value AI</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button type="submit">Estimate Value</button>
      </form>
      <div className="result">{result}</div>
    </div>
  );
}

export default App;

