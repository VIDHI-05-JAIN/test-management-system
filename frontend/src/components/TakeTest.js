import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './TakeTest.css';

const TakeTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetch(`http://localhost:5000/api/tests/${id}`)
      .then(res => res.json())
      .then(data => {
        setTest(data);
      })
      .catch(err => console.error('Error loading test:', err));
  }, [id]);

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (!userId) {
      alert('User not logged in.');
      return;
    }

    if (!autoSubmit) {
      const unanswered = test.questions.filter(q => !answers[q.id]);
      if (unanswered.length > 0) {
        alert(`Please answer all questions before submitting. ${unanswered.length} unanswered.`);
        return;
      }
    }

    let calculatedScore = 0;
    const userAnswers = [];

    for (const q of test.questions) {
      const selectedOption = answers[q.id] || null;
      const isCorrect = selectedOption === q.correct_option;
      const marks = isCorrect ? q.marks : 0;

      if (isCorrect) calculatedScore += q.marks;

      userAnswers.push({
        test_id: test.test.id,
        question_id: q.id,
        user_id: userId,
        user_answer: selectedOption,
        is_correct: isCorrect ? 1 : 0,
        marks_obtained: marks,
      });
    }

    try {
      const res = await fetch('http://localhost:5000/api/tests/answers/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: userAnswers }),
      });

      if (res.ok) {
        setScore(calculatedScore);
        setSubmitted(true);

        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', () => {
          window.history.pushState(null, '', window.location.href);
        });
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to save answers');
      }
    } catch (err) {
      console.error('Error submitting test:', err);
    }
  }, [userId, test, answers]);

  // Timer countdown
  useEffect(() => {
    if (submitted || !test) return;
    if (timeLeft === 0) {
      handleSubmit(true); // auto-submit when time runs out
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted, test, handleSubmit]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleOptionChange = (questionId, option) => {
    setAnswers({ ...answers, [questionId]: option });
  };

  const handleNext = () => {
    if (currentIndex < test.questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (!test) return <p style={{ textAlign: 'center' }}>Loading test...</p>;

  const currentQuestion = test.questions[currentIndex];

  return (
    <div className="container">
      <h2 className="title">{test.test.title}</h2>

      {/* Timer */}
      {!submitted && (
        <div style={{
          textAlign: 'center',
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: timeLeft < 60 ? 'red' : '#2e7d32',
          marginBottom: '1rem',
          padding: '0.5rem',
          background: timeLeft < 60 ? '#ffebee' : '#e8f5e9',
          borderRadius: '8px',
        }}>
          ⏱ Time Left: {formatTime(timeLeft)}
        </div>
      )}

      {submitted ? (
        <div className="result-box">
          <h3>✅ Test Submitted</h3>
          <p>Your Score: <strong>{score}</strong></p>
          <button className="btn" onClick={() => navigate('/user')}>Back to Dashboard</button>
        </div>
      ) : (
        <>
          {/* Question progress */}
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '0.5rem' }}>
            Question {currentIndex + 1} of {test.questions.length} | 
            Answered: {Object.keys(answers).length}/{test.questions.length}
          </p>

          {currentQuestion && (
            <div className="question-block">
              <p><strong>Q{currentIndex + 1}:</strong> {currentQuestion.question_text}</p>
              {['A', 'B', 'C', 'D'].map((opt) => (
                <label key={opt} className="option-label">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={opt}
                    checked={answers[currentQuestion.id] === opt}
                    onChange={() => handleOptionChange(currentQuestion.id, opt)}
                  />
                  {opt}: {currentQuestion[`option_${opt.toLowerCase()}`]}
                </label>
              ))}
            </div>
          )}

          <div className="navigation-buttons">
            <button className="btn" onClick={handleBack} disabled={currentIndex === 0}>← Back</button>
            {currentIndex < test.questions.length - 1 ? (
              <button className="btn" onClick={handleNext}>Next →</button>
            ) : (
              <button
                className="btn"
                onClick={() => handleSubmit(false)}
                disabled={Object.keys(answers).length !== test.questions.length}
              >
                Submit Test
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TakeTest;