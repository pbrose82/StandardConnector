import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

const SyncLogs = () => {
  const { integrationId } = useParams<{ integrationId: string }>();
  const navigate = useNavigate();
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Sync Logs</Typography>
      <Typography variant="body1">Viewing sync logs for integration: {integrationId}</Typography>
      
      <Box mt={3}>
        <Button 
          variant="outlined" 
          onClick={() => navigate(`/integrations/${integrationId}`)}
        >
          Back to Integration
        </Button>
      </Box>
    </Box>
  );
};

export default SyncLogs;
