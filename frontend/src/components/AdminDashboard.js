import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const handleLogout = () => {
  localStorage.clear();  // Remove user data
  navigate('/');         // Redirect to login page
};

  useEffect(() => {
    fetch(`http://localhost:5000/api/tests?page=${currentPage}`)
      .then(res => res.json())
      .then(data => {
        setTests(Array.isArray(data.tests) ? data.tests : []);
        setTotalPages(data.totalPages || 1);
      })
      .catch(err => {
        console.error('Error fetching tests:', err);
        setTests([]);
      });
  }, [currentPage]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    try {
      await fetch(`http://localhost:5000/api/tests/${id}`, { method: 'DELETE' });
      setTests(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="container">
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
      <h1 className="title">Admin Dashboard</h1>
      <button className="create-btn" onClick={() => navigate('/create-test')}>Create Test</button>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Published</th>
            <th>Total Questions</th>
            <th>Questions Answered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(tests) && tests.length > 0 ? (
            tests.map(exam => {
              const isAttempted = !!exam.attempted;

              return (
                <tr key={exam.id}>
                  <td>{exam.id}</td>
                  <td>
                    {exam.title}
                    {isAttempted && <span className="attempted-badge">Attempted</span>}
                  </td>
                  <td>{exam.published ? 'Yes' : 'No'}</td>
                  <td>{exam.total_questions || 0}</td>
                  <td>{exam.questions_answered || 0}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn action-btn" onClick={() => navigate(`/view-test/${exam.id}`)}>View</button>
                      <button
                        className="btn action-btn"
                        onClick={() => {
                          if(isAttempted) {
                            alert('❌ Test already attempted. Editing is disabled.');
                          }else {
                            navigate(`/edit-test/${exam.id}`);
                        }
                      }}
                      >
                        Edit
                      </button>
                      <button className="btn action-btn" onClick={() => handleDelete(exam.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr><td colSpan="6">No tests available.</td></tr>
          )}
        </tbody>
      </table>

      <div className="pagination">
        {currentPage > 1 && (
          <button className="page-btn" onClick={() => setCurrentPage(currentPage - 1)}>« Previous</button>
        )}
        {currentPage < totalPages && (
          <button className="page-btn" onClick={() => setCurrentPage(currentPage + 1)}>Next »</button>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
