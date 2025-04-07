import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
const API_URL = import.meta.env.MODE === "production"
  ? import.meta.env.VITE_API_URL_PROD
  : import.meta.env.VITE_API_URL_DEV;

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userrole, setUserrole] = useState('recipient'); // Default role
  const [deptId, setDeptId] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/users/register`, {
        username,
        password,
        userrole,
        deptId
      });
      localStorage.setItem('token', response.data.token); // Store token
      navigate('/departments'); // Navigate to departments page
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleRegister}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="text"
          placeholder="Department ID"
          value={deptId}
          onChange={(e) => setDeptId(e.target.value)}
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;
