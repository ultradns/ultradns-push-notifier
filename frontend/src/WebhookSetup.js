import React, { useState, useEffect } from 'react';
//import { Container, Typography, TextField, Button, CircularProgress, Box } from '@mui/material';
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';

function WebhookSetup({ onComplete }) {
  const [platformSelected, setPlatformSelected] = useState(null);
  const [setupStep, setSetupStep] = useState(0);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [waitingForTest, setWaitingForTest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false); // State to track accordion expansion

  // Poll for telemetry test completion
  useEffect(() => {
    if (waitingForTest) {
      const interval = setInterval(async () => {
        try {
          const { data } = await axios.get('/api/status');
          if (data.setup_complete) {
            setWaitingForTest(false);
            onComplete(); // Notify parent of setup completion
          }
        } catch (err) {
          console.error(err);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [waitingForTest, onComplete]);

  const submitWebhookUrl = async () => {
    setLoading(true);

    const { protocol, hostname, port } = window.location; // Get protocol, hostname, and port from the browser
    const baseUrl = `${protocol}//${hostname}${port ? `:${port}` : ''}`; // Construct the base URL

    try {
      const response = await axios.post('/api/setup', {
        webhook_url: webhookUrl,
        platform: platformSelected, // Send platform type to the backend
      });

      const { token, waiting_for_test } = response.data;

      setEndpoint(`${baseUrl}/api/${platformSelected}/${token}`);
      setWaitingForTest(waiting_for_test);
      setSetupStep(2); // Move to telemetry verification
      setError(null);
    } catch (err) {
      setError(`Failed to configure ${platformSelected} webhook`);
    } finally {
      setLoading(false);
    }
  };

  // Render setup steps
  if (setupStep === 0) {
    return (
      <Container maxWidth="sm">
        <Box 
          my={5} 
          textAlign="center"
        >
          <Typography 
            variant="h4" 
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              marginBottom: '24px',
            }}
          >
            Select Notification Platform
          </Typography>
          <Box 
            display="flex" 
            flexDirection="column" 
            alignItems="center" 
            my={3} 
            gap={3} 
            sx={{
              padding: '20px',
              borderRadius: '16px',
              backgroundColor: '#f9fafc',
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setPlatformSelected('teams');
                setSetupStep(1);
              }}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '240px',
                height: '120px',
                backgroundColor: '#d1e7ff',
                color: '#004085',
                borderRadius: '12px',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#b6d4fe',
                },
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <img
                src="/icons8-teams-144.png"
                alt="Microsoft Teams"
                style={{
                  width: '48px',
                  height: '48px',
                  marginBottom: '10px',
                }}
              />
              Microsoft Teams
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setPlatformSelected('slack');
                setSetupStep(1);
              }}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '240px',
                height: '120px',
                backgroundColor: '#e8f5e9',
                color: '#388e3c',
                borderRadius: '12px',
                fontWeight: 'bold',
                '&:hover': {
                  backgroundColor: '#c8e6c9',
                },
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s ease-in-out',
              }}
            >
              <img
                src="/icons8-slack-144.png"
                alt="Slack"
                style={{
                  width: '48px',
                  height: '48px',
                  marginBottom: '10px',
                }}
              />
              Slack
            </Button>
            <Button
              variant="outlined"
              disabled
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: '240px',
                height: '120px',
                color: 'text.disabled',
                borderColor: 'text.disabled',
                borderRadius: '12px',
                fontWeight: 'bold',
                backgroundColor: '#f9f9f9',
              }}
            >
              <img
                src="/icons8-discord-144.png"
                alt="Discord"
                style={{
                  width: '48px',
                  height: '48px',
                  marginBottom: '10px',
                }}
              />
              Discord (Coming Soon)
            </Button>
          </Box>
        </Box>
      </Container>
    );
  }


  if (setupStep === 1) {
    return (
      <Container maxWidth="sm">
        <Box my={5}>
          <Typography 
            variant="h4" 
            align="center" 
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              marginBottom: '16px',
            }}
          >
            Setup {platformSelected === 'teams' ? 'Teams' : 'Slack'} Webhook
          </Typography>

          {/* Webhook URL Input */}
          <TextField
            type="text"
            label={`${platformSelected === 'teams' ? 'Teams' : 'Slack'} Webhook URL`}
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            fullWidth
            margin="normal"
            sx={{
              backgroundColor: '#ffffff',
              borderRadius: '4px',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          />

          {/* Submit Button */}
          <Button
            onClick={() => {
              setExpanded(false); // Collapse instructions
              submitWebhookUrl();
            }}
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading || !webhookUrl}
            sx={{
              marginTop: '16px',
              padding: '10px',
              fontWeight: 'bold',
              textTransform: 'none',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              '&:disabled': {
                backgroundColor: '#e0e0e0',
                color: '#a0a0a0',
              },
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Submit'}
          </Button>

          {/* Error Message */}
          {error && (
            <Typography 
              color="error" 
              align="center" 
              sx={{
                marginTop: '16px',
                fontWeight: 'bold',
                color: '#d32f2f',
              }}
            >
              {error}
            </Typography>
          )}

          {/* Instructions Section */}
          {platformSelected === 'slack' && (
            <Accordion
              expanded={expanded}
              onChange={() => setExpanded(!expanded)}
              sx={{
                mt: 3,
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: '#d1e7ff',
                  borderBottom: '1px solid #e0e0e0',
                  padding: '10px 16px',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 'bold',
                    color: '#004085',
                  }}
                >
                  Instructions
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  backgroundColor: '#ffffff',
                  padding: '16px',
                  borderRadius: '0 0 8px 8px',
                  boxShadow: 'inset 0px 1px 2px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: 'left',
                    color: '#333',
                    lineHeight: 1.6,
                  }}
                >
                  1. Go to{' '}
                  <a
                    href="https://api.slack.com/apps"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#004085',
                      fontWeight: 'bold',
                      textDecoration: 'none',
                    }}
                  >
                    https://api.slack.com/apps
                  </a>
                  <br />
                  2. Click "Create a New App"
                  <br />
                  3. Select "From Scratch"
                  <br />
                  4. Give the app a name and select the workspace you want to push notifications to
                  <br />
                  <img
                    src="/slack-wh-setup1.jpg"
                    alt="Slack Setup Step 4 Screenshot"
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <br />
                  5. In the left navigation panel, select "Incoming Webhooks"
                  <br />
                  <img
                    src="/slack-wh-setup2.jpg"
                    alt="Slack Setup Step 5 Screenshot"
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <br />
                  6. Enable incoming webhooks and click "Add New Webhook to Workspace"
                  <br />
                  <img
                    src="/slack-wh-setup3.jpg"
                    alt="Slack Setup Step 6 Screenshot"
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <br />
                  7. Select the channel you want to push notifications to and click "Allow"
                  <br />
                  <img
                    src="/slack-wh-setup4.jpg"
                    alt="Slack Setup Step 7 Screenshot"
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <br />
                  8. Copy the webhook URL that is generated and paste it above.
                </Typography>
              </AccordionDetails>
            </Accordion>
          )}

          {platformSelected === 'teams' && (
            <Accordion
              expanded={expanded}
              onChange={() => setExpanded(!expanded)}
              sx={{
                mt: 3,
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  backgroundColor: '#e3f2fd',
                  borderBottom: '1px solid #e0e0e0',
                  padding: '10px 16px',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 'bold',
                    color: '#1976d2',
                  }}
                >
                  Instructions
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  backgroundColor: '#ffffff',
                  padding: '16px',
                  borderRadius: '0 0 8px 8px',
                  boxShadow: 'inset 0px 1px 2px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    textAlign: 'left',
                    color: '#333',
                    lineHeight: 1.6,
                  }}
                >
                  1. Go to your Teams channel
                  <br />
                  2. Click on the "..." in the top right
                  <br />
                  <img
                    src="/teams-wh-setup1.png"
                    alt="Teams Setup Step 2 Screenshot"
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <br />
                  3. Click on "Workflows"
                  <br />
                  4. Search for and select "Post to a channel when a webhook request is received"
                  <br />
                  <img
                    src="/teams-wh-setup2.png"
                    alt="Teams Setup Step 4 Screenshot"
                    style={{
                      width: '100%',
                      marginTop: '10px',
                      border: '1px solid #ccc',
                      borderRadius: '8px',
                      boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <br />
                  5. Follow the prompts and copy the webhook URL to paste above.
                </Typography>
              </AccordionDetails>
            </Accordion>
          )}

        </Box>
      </Container>
    );
  }

  if (setupStep === 2) {
    const { protocol } = window.location; // Get the protocol from the browser

    return (
      <Container maxWidth="sm">
        <Box my={5} textAlign="center">
          <Typography
            variant="h4"
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              marginBottom: 3,
              textAlign: 'center',
            }}
          >
            Waiting for UltraDNS Test Message...
          </Typography>

          {/* Warning message for HTTP protocol */}
          {protocol === 'http:' && (
            <Typography
              variant="body1"
              sx={{
                marginTop: 2,
                marginBottom: 2,
                padding: '10px',
                backgroundColor: '#ffebe6',
                border: '1px solid #ffcccc',
                borderRadius: '8px',
                color: '#b71c1c',
                fontWeight: 'bold',
                textAlign: 'center',
                lineHeight: 1.6,
              }}
            >
              <span>Warning:</span> UltraDNS <span style={{ fontStyle: 'italic' }}>requires</span> push
              notifications to be sent over HTTPS. Refer to the user guide for instructions on setting up
              a reverse proxy with the container. Otherwise, please ensure this endpoint is secured and
              adjust the URL accordingly.
            </Typography>
          )}

          <Box
            mt={3}
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={1}
            sx={{
              padding: '10px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Box
              component="code"
              sx={{
                display: 'inline-block',
                padding: '8px',
                backgroundColor: '#ffffff',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '14px',
                color: '#333',
                whiteSpace: 'nowrap',
                overflow: 'auto',
              }}
            >
              {endpoint}
            </Box>
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{
                textTransform: 'none',
                padding: '6px 12px',
                fontSize: '14px',
              }}
              onClick={() => navigator.clipboard.writeText(endpoint)}
            >
              Copy
            </Button>
          </Box>

          {/* Instructions Section */}
          <Accordion
            expanded={expanded}
            onChange={() => setExpanded(!expanded)}
            sx={{
              mt: 3,
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e0e0e0',
              boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="instructions-content"
              sx={{
                backgroundColor: '#e3f2fd',
                borderBottom: '1px solid #e0e0e0',
                padding: '10px 16px',
              }}
            >
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 'bold',
                  color: '#1976d2',
                }}
              >
                Instructions
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                backgroundColor: '#ffffff',
                padding: '16px',
                borderRadius: '0 0 8px 8px',
                boxShadow: 'inset 0px 1px 2px rgba(0, 0, 0, 0.1)',
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  textAlign: 'left',
                  color: '#333',
                  lineHeight: 1.6,
                }}
              >
                1. Log in to the UltraDNS user interface
                <br />
                2. Click on "Accounts" in the left-hand navigation
                <br />
                <img
                  src="/udns-wh-setup1.jpg"
                  alt="Step 2 Screenshot"
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <br />
                3. Click on your account name
                <br />
                <img
                  src="/udns-wh-setup2.jpg"
                  alt="Step 3 Screenshot"
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <br />
                4. Navigate to the "Notification Settings" tab
                <br />
                5. Under "Realtime Push Notification" click "+Add"
                <br />
                <img
                  src="/udns-wh-setup3.jpg"
                  alt="Step 5 Screenshot"
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <br />
                6. Enter a name for your endpoint and the Lambda URL
                <br />
                <img
                  src="/udns-wh-setup4.jpg"
                  alt="Step 6 Screenshot"
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <br />
                7. Click "Test Connection"
                <br />
                8. Click "Configure Channels"
                <br />
                9. Configure your desired channels and save
              </Typography>
            </AccordionDetails>
          </Accordion>

          <CircularProgress sx={{ mt: 3 }} />
        </Box>
      </Container>
    );
  }

  return null;
}

export default WebhookSetup;

