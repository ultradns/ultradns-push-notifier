import React, { useState } from 'react';
import axios from 'axios';
import { Container, Typography, TextField, Button, Box, CircularProgress } from '@mui/material';

function Authentication({ status, onLoginSuccess }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await axios.post('/api/login', { password });
      onLoginSuccess(); // Notify parent that login was successful
      setError(null);
    } catch (err) {
      setError('Invalid password');
    } finally {
      setLoading(false);
    }
  };

  // Fallback while `status` is being fetched
  if (!status) {
    return (
      <Container maxWidth="sm">
        <Box my={5} textAlign="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        my={5}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 3,
        }}
      >
        <Typography
          variant="h4"
          align="center"
          sx={{
            fontWeight: 'bold',
            color: 'primary.main',
            marginBottom: 2,
          }}
        >
          {status.has_admin_password ? 'Login' : 'Set Admin Password'}
        </Typography>
        <TextField
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          sx={{
            '& .MuiInputBase-root': {
              borderRadius: '8px',
              backgroundColor: '#f9f9f9',
            },
            '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.main',
            },
          }}
        />
        <Button
          onClick={handleLogin}
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading || !password}
          sx={{
            height: '48px',
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 'bold',
          }}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: 'white' }} />
          ) : status.has_admin_password ? (
            'Login'
          ) : (
            'Set Password'
          )}
        </Button>
        {error && (
          <Typography
            color="error"
            align="center"
            sx={{
              fontSize: '0.875rem',
              fontWeight: '500',
              marginTop: 2,
            }}
          >
            {error}
          </Typography>
        )}
      </Box>
    </Container>
  );
}

export default Authentication;

