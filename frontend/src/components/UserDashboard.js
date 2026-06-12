import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

const UserDashboard = () => {
  const [tests, setTests] = useState([]);
  const [attemptedTestIds, setAttemptedTestIds] = useState([]);
  const navigate = useNavigate();
  const [answerSummary, setAnswerSummary] = useState({});
  const userId = localStorage.getItem('userId');

  const handleLogout = () => {
    localStorage.clear();  // Clear userId and role
    navigate('/');         // Redirect to login
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch published tests
        const testRes = await fetch('http://localhost:5000/api/tests/published');
        const testData = await testRes.json();
        setTests(Array.isArray(testData) ? testData : testData.tests || []);

        // 2. Fetch attempted tests by user
        const attemptRes = await fetch(`http://localhost:5000/api/tests/attempted/${userId}`);
        const attemptData = await attemptRes.json();
        setAttemptedTestIds(attemptData.map(row => row.test_id));

        // 3. Fetch question attempt summary (like 10/50 answered)
        const summaryRes = await fetch(`http://localhost:5000/api/tests/attempt-summary/${userId}`);
        const summaryData = await summaryRes.json();
        const summaryMap = {};
        summaryData.forEach(row => {
          summaryMap[row.test_id] = row;
        });
        setAnswerSummary(summaryMap);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  const handleTakeTest = (testId) => {
    navigate(`/take-test/${testId}`);
  };

  return (
    <div className="container">
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
      <h2 className="title">User Dashboard</h2>
      <h3 className="subtitle">Available Tests</h3>
      {tests.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No tests available yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Total Questions</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {tests.map(test => (
              <tr key={test.id}>
                <td>{test.id}</td>
                <td>{test.title}</td>
                <td>{test.total_questions || '-'}</td>
                <td>
                  {attemptedTestIds.includes(test.id) ? (
                    <div className="attempted-summary">
                      {answerSummary[test.id] ? (
                        <>
                          ✅ {answerSummary[test.id].answered}/{answerSummary[test.id].total_questions} Answered
                          <br />
                          <button
                            className="btn view-result-btn"
                            onClick={() => navigate(`/result/${userId}/${test.id}`)}
                          >
                            View Result
                          </button>
                        </>
                      ) : (
                        <>
                          ✅ Attempted
                          <br />
                          <button
                            className="btn view-result-btn"
                            onClick={() => navigate(`/result/${userId}/${test.id}`)}
                          >
                            View Result
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <button className="btn" onClick={() => handleTakeTest(test.id)}>
                      Take Test
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserDashboard;
