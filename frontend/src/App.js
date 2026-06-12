import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import CreateTest from './components/CreateTest';
import TestList from './components/TestList';
import ViewTest from './components/ViewTest';
import EditTest from './components/EditTest';
import UserDashboard from './components/UserDashboard';
import TakeTest from './components/TakeTest';
import TestResult from './components/TestResult';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/create-test" element={<CreateTest />} />
        <Route path="/tests" element={<TestList />} />
        <Route path="/view-test/:id" element={<ViewTest />} />
        <Route path="/edit-test/:id" element={<EditTest />} />
        <Route path="/view-users" element={<h2>View Users Page</h2>} />
        <Route path="/view-results" element={<h2>View Results Page</h2>} />
        <Route path="/user" element={<UserDashboard />} />
        <Route path="/take-test/:id" element={<TakeTest />} />
        <Route path="/result/:userId/:testId" element={<TestResult />} />
      </Routes>
    </Router>
  );
}

export default App;
