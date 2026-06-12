import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ViewTest.css';

const ViewTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState([]);


  useEffect(() => {
    fetch(`http://localhost:5000/api/tests/${id}`)
      .then(res => res.json())
      .then(data => {
        setTest(data.test);
        setQuestions(data.questions);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching test:', err);
        setLoading(false);
      });

    // fetch(`http://localhost:5000/api/tests/${id}/scores`)
    //   .then(res => res.json())
    //   .then(data => setScores(data))
    //   .catch(err => {
    //     console.error('Error fetching scores:', err);
    //   });
    fetch(`http://localhost:5000/api/tests/${id}/scores`)
      .then(res => res.json())
      .then(data => {
        console.log("SCORES DATA:", data); // 🔍 Confirm structure
        setScores(data);
      })
      .catch(err => {
        console.error('Error fetching scores:', err);
      });
    
  }, [id]);

  if (loading) return <p>Loading test...</p>;
  if (!test) return <p>Test not found.</p>;

  return (
    <div className="view-container">
      <h2>{test.title}</h2>
      <p>Status: <strong>{test.is_published ? 'Published' : 'Draft'}</strong></p>
      <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>

      {questions.length === 0 ? (
        <p>No questions available for this test.</p>
      ) : (
        <table className="question-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Question</th>
              <th>Options</th>
              <th>Correct</th>
              <th>Marks</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, idx) => (
              <tr key={q.id}>
                <td>{idx + 1}</td>
                <td>{q.question_text}</td>
                <td>
                  <ul>
                    <li>A. {q.option_a}</li>
                    <li>B. {q.option_b}</li>
                    <li>C. {q.option_c}</li>
                    <li>D. {q.option_d}</li>
                  </ul>
                </td>
                <td>{q.correct_option}</td>
                <td>{q.marks}</td>
              </tr>
            ))}
          </tbody>
        </table>
              )}
        {scores.length > 0 && (
          <div className="score-section">
            <h3>User Scores</h3>
            <table className="score-table">
              <thead>
                <tr>
                  <th>User Mobile</th>
                  <th>Correct Answers</th>
                  <th>Total Answered</th>
                  <th> Marks </th>
                </tr>
              </thead>
              <tbody>
                {scores.map((s, index) => (
                  <tr key={index}>
                    <td>{s.user_mobile || `User ${s.user_id}`}</td>
                    <td>{s.correct_answers}</td>
                    <td>{s.total_answered}</td>
                    <td>{s.marks_obtained || 0} / {s.total_marks || 0}</td>
                    {/* <td>{s.marks_obtained} / {s.total_marks}</td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
    </div>
  );
};

export default ViewTest;
