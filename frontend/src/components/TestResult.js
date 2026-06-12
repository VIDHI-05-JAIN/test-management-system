import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TestResult.css';

const TestResult = () => {
  const { userId, testId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/tests/${testId}/scores`);
        const data = await res.json();

        const userResult = data.find(r => r.user_id.toString() === userId);
        setResult(userResult || null);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching result:', err);
        setLoading(false);
      }
    };

    fetchResult();
  }, [userId, testId]);

  if (loading) return <p>Loading...</p>;

  if (!result) {
    return (
      <div className="result-container">
        <h2>No result found for this test</h2>
        <button onClick={() => navigate(-1)} className="btn">Back</button>
      </div>
    );
  }

  return (
    <div className="result-container">
      <h2>Test Result</h2>
      <p><strong>Mobile:</strong> {result.user_mobile}</p>
      <p><strong>Total Answered:</strong> {result.total_answered}</p>
      <p><strong>Correct Answers:</strong> {result.correct_answers}</p>
      <p><strong>Score:</strong> {result.correct_answers} / {result.total_answered}</p>
      <button onClick={() => navigate(-1)} className="btn">Back</button>
    </div>
  );
};

export default TestResult;
