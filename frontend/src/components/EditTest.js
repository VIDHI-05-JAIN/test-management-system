import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './EditTest.css'; // ⬅️ Make sure this file exists

const EditTest = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([]);
  const [status, setStatus] = useState('draft');
  const [message, setMessage] = useState('');

  // Fetch existing test + questions
  useEffect(() => {
    fetch(`http://localhost:5000/api/tests/${id}`)
      .then(res => res.json())
      .then(data => {
        setTitle(data.test.title);
        setStatus(data.test.is_published ? 'published' : 'draft');
        const formattedQuestions = data.questions.map(q => ({
        id: q.id, // ⬅️ include question ID
        question: q.question_text,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        correct: q.correct_option,
        marks: q.marks
        }));

        setQuestions(formattedQuestions);
      })
      .catch(err => console.error('Error fetching test:', err));
  }, [id]);

  const handleChange = (index, field, value) => {
    const updated = [...questions];
    if (field === 'question') updated[index].question = value;
    else if (field === 'marks') updated[index].marks = value;
    else updated[index].options[field] = value;
    setQuestions(updated);
  };

  const handleCorrectChange = (index, value) => {
    const updated = [...questions];
    updated[index].correct = value;
    setQuestions(updated);
  };

  const addQuestion = () => {
    setQuestions([...questions, {
      question: '',
      options: ['', '', '', ''],
      correct: 'A',
      marks: 1
    }]);
  };

  const removeQuestion = (index) => {
    const updated = [...questions];
    updated.splice(index, 1);
    setQuestions(updated);
  };
  const handleDeleteQuestion = async (questionId) => {
  if (!window.confirm('Are you sure you want to delete this question?')) return;

  try {
    await fetch(`http://localhost:5000/api/questions/${questionId}`, {
      method: 'DELETE',
    });

    setQuestions(prev => prev.filter(q => q.id !== questionId));
  } catch (err) {
    console.error('Failed to delete question:', err);
  }
};


  const handleSubmit = async (type) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          questions,
          status: type
        })
      });

      const data = await res.json();
      setMessage(data.message);

      if (res.ok) {
        setTimeout(() => navigate('/admin'), 1000);
      }
    } catch (err) {
      console.error('Submit error:', err);
      setMessage('Failed to update test.');
    }
  };
  const handleDeleteTest = async () => {
  if (!window.confirm('Are you sure you want to delete this test?')) return;

  try {
    await fetch(`http://localhost:5000/api/tests/${id}`, {
      method: 'DELETE'
    });

    navigate('/dashboard'); // Redirect after successful delete
  } catch (err) {
    console.error('Delete test error:', err);
    setMessage('Failed to delete test.');
  }
};


  return (
    <div className="edit-container">
      <h2>Edit Test</h2>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Test Title"
      />

      {questions.map((q, index) => (
        <div key={index} className="question-block">
          <input
            type="text"
            value={q.question}
            onChange={(e) => handleChange(index, 'question', e.target.value)}
            placeholder="Question"
          />

          {['A', 'B', 'C', 'D'].map((opt, i) => (
            <input
              key={opt}
              className="option-input"
              type="text"
              value={q.options[i]}
              onChange={(e) => handleChange(index, i, e.target.value)}
              placeholder={`Option ${opt}`}
            />
          ))}

          <div className="btn-group">
            <label>Correct:</label>
            <select value={q.correct} onChange={(e) => handleCorrectChange(index, e.target.value)}>
              {['A', 'B', 'C', 'D'].map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>

            <input
              type="number"
              value={q.marks}
              onChange={(e) => handleChange(index, 'marks', e.target.value)}
              placeholder="Marks"
              style={{ width: '100px', marginLeft: '10px' }}
            />

            {/* <button className="btn delete-btn" onClick={() => removeQuestion(index)}>Delete</button> */}
          </div>
        </div>
      ))}

      <div className="btn-group">
        <button className="btn" onClick={addQuestion}>Add Question</button>
        <button className="btn" onClick={() => handleSubmit('draft')}>Save as Draft</button>
        <button className="btn" onClick={() => handleSubmit('published')}>Publish</button>
        <button onClick={handleDeleteTest} className="btn delete-btn">🗑️ Delete Test</button>
      </div>

      {message && <p className="success-message">{message}</p>}
    </div>
  );
};

export default EditTest;
