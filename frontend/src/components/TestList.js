import React, { useEffect, useState } from 'react';

const TestList = () => {
  const [tests, setTests] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/api/tests')
      .then(res => res.json())
      .then(data => setTests(data))
      .catch(err => {
        console.error('Error:', err);
        setError('Failed to fetch tests');
      });
  }, []);

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto' }}>
      <h2>All Tests</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {tests.length === 0 ? (
        <p>No tests available</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tests.map((test) => (
            <li key={test.id} style={{ padding: '15px', borderBottom: '1px solid #ccc' }}>
              <strong>{test.title}</strong> <br />
              Date: {test.date} <br />
              Duration: {test.duration} min
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default TestList;
