import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreateTest.css';

const CreateTest = () => {
  const [testName, setTestName] = useState('');
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correct: '', marks: '' }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const handleInputChange = (index, field, value) => {
    const newQuestions = [...questions];
    newQuestions[index][field] = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, optIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[optIndex] = value;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: '', options: ['', '', '', ''], correct: '', marks: '' }
    ]);
    setCurrentIndex(questions.length);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async (action) => {
    const payload = {
      title: testName,
      questions,
      status: action === 'publish' ? 'published' : 'draft'
    };

    try {
      const response = await fetch('http://localhost:5000/api/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      alert(data.message || 'Test submitted');
      navigate('/admin');
    } catch (err) {
      console.error(err);
      alert('Submission failed');
    }
  };

  const current = questions[currentIndex];

  return (
    <div className="container">
      <h2>Create New Test</h2>

      <input
        type="text"
        value={testName}
        onChange={(e) => setTestName(e.target.value)}
        placeholder="Test Name"
        required
      />

      <div className="question">
        <input
          type="text"
          value={current.question}
          onChange={(e) => handleInputChange(currentIndex, 'question', e.target.value)}
          placeholder="Question Text"
          required
        />

        {current.options.map((opt, i) => (
          <input
            key={i}
            type="text"
            value={opt}
            onChange={(e) => handleOptionChange(currentIndex, i, e.target.value)}
            placeholder={`Option ${String.fromCharCode(65 + i)}`}
            required={i < 2}
          />
        ))}

        <p>Correct Answer:</p>
        {[0, 1, 2, 3].map(i => (
          <label key={i}>
            <input
              type="radio"
              name={`correct-${currentIndex}`}
              value={String.fromCharCode(65 + i)}
              checked={current.correct === String.fromCharCode(65 + i)}
              onChange={() => handleInputChange(currentIndex, 'correct', String.fromCharCode(65 + i))}
              required
            /> {String.fromCharCode(65 + i)}
          </label>
        ))}

        <input
          type="number"
          value={current.marks}
          onChange={(e) => handleInputChange(currentIndex, 'marks', e.target.value)}
          placeholder="Marks"
          required
        />
      </div>

      <div className="navigation">
        <button type="button" onClick={previousQuestion}>←</button>
        <button type="button" onClick={addQuestion}>Add Question</button>
        <button type="button" onClick={nextQuestion}>→</button>
        <button className="btn-save" onClick={() => handleSubmit('save')}>Save Test</button>
        <button className="btn-publish" onClick={() => handleSubmit('publish')}>Publish Test</button>
      </div>
    </div>
  );
};

export default CreateTest;
