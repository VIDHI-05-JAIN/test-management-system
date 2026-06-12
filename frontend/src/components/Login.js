import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
  if (otp !== '0000') {
    setMessage('Invalid OTP');
    return;
  }

  try {
    const response = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, otp })
    });

    const data = await response.json();

    if (response.ok && data.user) {
      setMessage('Login successful!');

      // ✅ Store userId for later use in UserDashboard
      localStorage.setItem('userId', data.user.id); // 👈 this is important

      // 🔁 Role-based redirection
      if (mobile === '7550136164') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } else {
      setMessage(data.message || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    setMessage('Something went wrong');
  }
};


  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>

        <label>Mobile Number:</label>
        <input
          type="text"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
          placeholder="Enter mobile number"
          required
        />

        <label>OTP:</label>
        <input
          type="password"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          required
        />

        <button onClick={handleLogin}>Login</button>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
};

export default Login;


// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import './Login.css';

// const Login = () => {
//   const [mobile, setMobile] = useState('');
//   const [otp, setOtp] = useState('');
//   const [message, setMessage] = useState('');
//   const navigate = useNavigate();

//   const handleLogin = async () => {
//     try {
//       const response = await fetch('http://localhost:5000/auth/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({ mobile, otp })
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setMessage('Login successful!');
//         localStorage.setItem('user', JSON.stringify(data.user));

//         if (mobile === '7550136164') {
//           navigate('/admin');
//         } else {
//           navigate('/user');
//         }
//       } else {
//         setMessage(data.message || 'Login failed');
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       setMessage('Something went wrong');
//     }
//   };

//   return (
//     <div className="login-container">
//       <div className="login-card">
//         <h2>Login</h2>
//         <label>Mobile Number:</label>
//         <input
//           type="text"
//           value={mobile}
//           onChange={(e) => setMobile(e.target.value)}
//           placeholder="Enter mobile number"
//         />
//         <label>OTP:</label>
//         <input
//           type="password"
//           value={otp}
//           onChange={(e) => setOtp(e.target.value)}
//           placeholder="Enter OTP"
//         />
//         <button onClick={handleLogin}>Login</button>
//         {message && <p className="message">{message}</p>}
//       </div>
//     </div>
//   );
// };

// export default Login;
