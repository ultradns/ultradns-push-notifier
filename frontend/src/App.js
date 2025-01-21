import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Container, Box, Typography, CircularProgress, Paper, Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import WebhookSetup from './WebhookSetup';
import Authentication from './Authentication';
import TopBar from './TopBar';
import theme from './theme';

function App() {
  const [isGuiDisabled, setIsGuiDisabled] = useState(null);
  const [status, setStatus] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch the GUI status from the backend
  useEffect(() => {
    const fetchGuiStatus = async () => {
      try {
        const response = await axios.get('/api/gui-status');
        setIsGuiDisabled(response.data.gui_disabled);
      } catch (error) {
        console.error('Failed to fetch GUI status:', error);
        setIsGuiDisabled(false); // Default to false if there's an error
      }
    };

    fetchGuiStatus();
  }, []);

  // Initialize the app on first render (when GUI is not disabled)
  useEffect(() => {
    if (isGuiDisabled === false) {
      const initializeApp = async () => {
        await fetchApiToken(); // Fetch and set the API token
        await fetchStatus();   // Fetch the app status
      };
      initializeApp();
    }
  }, [isGuiDisabled]);

  // Function to fetch the API token
  const fetchApiToken = async () => {
    try {
      const response = await axios.get('/api/init'); // Fetch the token from the backend
      const { api_token } = response.data;
      axios.defaults.headers.common['X-Api-Token'] = api_token; // Set the token globally for all requests
    } catch (err) {
      console.error('Failed to fetch API token:', err);
    }
  };

  // Function to fetch the app status
  const fetchStatus = async () => {
    try {
      const { data } = await axios.get('/api/status');
      setStatus(data);
      setLoggedIn(data.logged_in);
      setShowSetup(!data.has_webhooks);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setStatus(null);
      setLoggedIn(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    setLoading(true);
    try {
      await axios.post('/api/logout');
      window.location.reload(); // Force a full page reload
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handler for adding a webhook
  const handleAddWebhook = () => {
    setShowSetup(true);
  };

  // Handler for completing webhook setup
  const handleSetupComplete = () => {
    setShowSetup(false);
    fetchStatus();
  };

  // Handler for deleting a webhook
  const handleDeleteWebhook = async (token) => {
    try {
      await axios.delete(`/api/webhooks/${token}`);
      setStatus((prevState) => ({
        ...prevState,
        webhooks: prevState.webhooks.filter((webhook) => webhook.token !== token),
      }));
    } catch (err) {
      console.error('Failed to delete webhook:', err);
    }
  };

  // Wait until the GUI status is determined
  if (isGuiDisabled === null) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <TopBar />
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', my: 5 }}>
            <Typography variant="h4" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  // GUI is turned off
  if (isGuiDisabled) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <TopBar />
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', my: 5 }}>
            <Typography variant="h4" color="text.secondary">
              The web interface is disabled. Please contact this service's administrator for assistance.
            </Typography>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  // Render a loading state while fetching the app status
  if (!status) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <TopBar />
        <Container maxWidth="md">
          <Box sx={{ my: 5, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TopBar />
      <Container maxWidth="md">
        <Box sx={{ my: 5 }}>
          {!loggedIn || (status && !status.has_admin_password) ? (
            <Authentication status={status} onLoginSuccess={fetchStatus} />
          ) : showSetup ? (
            <WebhookSetup onComplete={handleSetupComplete} />
          ) : (
            <>
              <Typography
                variant="h4"
                align="center"
                sx={{ mb: 4, fontWeight: 'bold', color: 'primary.main' }}
              >
                Dashboard
              </Typography>
              <Box sx={{ my: 3 }}>
                {status.webhooks.map((webhook, index) => (
                  <Box key={index} sx={{ my: 2 }}>
                    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          mb: 2,
                        }}
                      >
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 'bold', color: 'primary.main' }}
                        >
                          Webhook Details
                        </Typography>
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteWebhook(webhook.token)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography variant="body1">
                          <strong>Type:</strong> {webhook.type}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Status:</strong> {webhook.status}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Token:</strong>{' '}
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-block',
                              px: 1,
                              py: 0.5,
                              backgroundColor: 'background.default',
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              fontFamily: 'monospace',
                              fontSize: 14,
                            }}
                          >
                            {webhook.token}
                          </Box>
                        </Typography>
                        <Typography variant="body1">
                          <strong>URL:</strong>{' '}
                          <Box
                            component="span"
                            sx={{
                              display: 'inline-block',
                              px: 1,
                              py: 0.5,
                              backgroundColor: 'background.default',
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              fontFamily: 'monospace',
                              fontSize: 14,
                              wordBreak: 'break-word',
                            }}
                          >
                            {webhook.webhook_url}
                          </Box>
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                ))}
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mt: 3 }}>
                <Button
                  onClick={handleLogout}
                  variant="contained"
                  color="secondary"
                  disabled={loading}
                  sx={{ flex: 1 }}
                >
                  Logout
                </Button>
                <Button
                  onClick={handleAddWebhook}
                  variant="contained"
                  color="primary"
                  sx={{ flex: 1 }}
                >
                  Add Webhook
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;