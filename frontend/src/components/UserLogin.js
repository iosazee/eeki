import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Typography, Card, CardContent } from "@mui/material";
import { API_URL, BASE_URL } from '../constants';
import axios from 'axios';

function UserLogin() {
  const [formData, setFormData] = useState({
    firstname: '',
    email: '',
    password: ''
  })
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();


  const handleSubmit = async (event) => {
    event.preventDefault();
    const endpoint = isRegistering ? `${BASE_URL}auth/users/` : `${BASE_URL}auth/jwt/create/`;
    const userData = isRegistering ? formData : {email: formData.email, password: formData.password};
    try {
      const response = await axios.post(endpoint, userData);
      const { access, refresh } = response.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
  
      if (isRegistering) {
        setSuccess('Registration successful, please login');
        setIsRegistering(false);
      } else {
        // get the user id from the user endpoint using the JWT access token
        const userResponse = await axios.get(`${API_URL}user/`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `JWT ${access}`,
          },
        });
        const userId = userResponse.data.results[0].id; // get the user id from the user endpoint response data
        localStorage.setItem('user_id', userId)
  
        // get the session key from the user endpoint using the JWT access token
        const sessionResponse = await axios.get(`${API_URL}user/${userId}/`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `JWT ${access}`,
          },
        });
        if (sessionResponse.status === 200) {
          const sessionKey = sessionResponse.data.session_key;
          localStorage.setItem('session_key', sessionKey);
        } else {
          setError('Error getting session');
        }
  
        // Create a cart for the user
        const cartData = {
          user_id: userId,
          session_key: localStorage.getItem('session_key') || '',
        };
        const cartResponse = await axios.post(`${API_URL}cart/`, cartData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `JWT ${access}`,
          },
        });
        if (cartResponse.status === 201) {
          const cartData = cartResponse.data;
          localStorage.setItem('cart_id', cartData.id);
        } else {
          setError('Error creating cart');
        }
  
        navigate('/');
      }
    } catch (error) {
      console.error(error);
      setError('Invalid username or password');
    }
  };
  



  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <Card style={{ maxWidth: 450, margin: "0 auto", padding: "20px 5px" }} >
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Typography variant="h4" component="h2" gutterBottom>
            {isRegistering ? 'Register' : 'Login'}
          </Typography>
          {error && (
            <Typography variant="subtitle1" component="p" color="error" gutterBottom>
              {error}
            </Typography>
          )}
          {success && (
            <Typography variant="subtitle1" component="p" color="success" gutterBottom>
              {success}
            </Typography>
          )}
          {isRegistering && (
            <TextField
              label="FirstName"
              fullWidth
              margin="normal"
              name='firstname'
              value={formData.firstname}
              onChange={handleChange}
            />
          )}
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <TextField
            label="Password"
            fullWidth
            margin="normal"
            type="password"
            name='password'
            value={formData.password}
            onChange={handleChange}
          />
          <Button variant="contained" color="primary" type="submit">
            {isRegistering ? 'Register' : 'Login'} {/* display register or login based on isRegistering */}
          </Button>
          <Button variant="text" color="primary" onClick={() => setIsRegistering(!isRegistering)}>
            {isRegistering ? 'Already have an account? Login' : 'New user? Register'} {/* toggle isRegistering */}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default UserLogin;