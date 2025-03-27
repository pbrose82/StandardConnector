import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

const MappingCreate = () => {
  const { integrationId } = useParams<{ integrationId: string }>();
  const navigate = useNavigate();
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Create Mapping</Typography>
      <Typography variant="body1">Creating mapping for integration: {integrationId}</Typography>
      
      <Box mt={3}>
        <Button 
          variant="outlined" 
          onClick={() => navigate(`/integrations/${integrationId}/mappings`)}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default MappingCreate;
