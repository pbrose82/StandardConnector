// frontend/src/pages/IntegrationDetail.tsx
import React from 'react';
import { Typography, Box, Button, CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

const IntegrationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Integration Details</Typography>
      <Typography variant="body1">Viewing integration with ID: {id}</Typography>
      
      <Box mt={3} display="flex" gap={2}>
        <Button variant="outlined" onClick={() => navigate('/integrations')}>
          Back to List
        </Button>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate(`/integrations/${id}/mappings`)}
        >
          View Mappings
        </Button>
      </Box>
    </Box>
  );
};

export default IntegrationDetail;
