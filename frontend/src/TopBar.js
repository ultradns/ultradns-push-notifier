import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';

function TopBar() {
  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: '#ffffff',
        height: '45px',
        justifyContent: 'center', // Center the content vertically
        boxShadow: 'none',
        borderBottom: '1px solid #e0e0e0', // Subtle border for separation
      }}
    >
      <Toolbar sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        {/* Company Logo */}
        <Box
          component="img"
          src="/DigiCertLogo.png"
          alt="DigiCert Logo"
          sx={{
            height: 40, // Logo size
            marginRight: 'auto', // Align logo to the left
            padding: '4px',
          }}
        />
        {/* Title aligned to the right */}
        <Typography
          variant="h6"
          sx={{
            color: '#0174C3', // Blue text to match theme
            fontWeight: 'bold',
            textAlign: 'right',
            fontSize: '1rem', // Text size
            marginLeft: 'auto', // Align text to the right
          }}
        >
          UltraDNS Push Notifier
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;
