import React, { useEffect, useState } from 'react';
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

  const userId = localStorage.getItem('userId');

  useEffect(() => {
    fetch(`http://localhost:5000/api/tests/${id}`)
      .then(res => res.json())
      .then(data => {
        setTest(data);
      })
      .catch(err => console.error('Error loading test:', err));
  }, [id]);

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

  const handleSubmit = async () => {
  if (!userId) {
    alert('User not logged in.');
    return;
  }

  const unanswered = test.questions.filter(q => !answers[q.id]);
  if (unanswered.length > 0) {
    alert(`Please answer all questions before submitting. ${unanswered.length} unanswered.`);
    return;
  }

  let calculatedScore = 0;
  const userAnswers = [];

  for (const q of test.questions) {
    const selectedOption = answers[q.id];
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

      // 🚫 Prevent browser back after submit
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
};


  if (!test) return <p style={{ textAlign: 'center' }}>Loading test...</p>;

  const currentQuestion = test.questions[currentIndex];

  return (
    <div className="container">
      <h2 className="title">{test.test.title}</h2>

      {submitted ? (
        <div className="result-box">
          <h3>✅ Test Submitted</h3>
          <p>Your Score: <strong>{score}</strong></p>
          <button className="btn" onClick={() => navigate('/user')}>Back to Dashboard</button>
        </div>
      ) : (
        <>
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
                onClick={handleSubmit}
                disabled={Object.keys(answers).length !== test.questions.length}
              >
                Submit Test
              </button>

              // <button className="btn" onClick={handleSubmit}>Submit Test</button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TakeTest;
