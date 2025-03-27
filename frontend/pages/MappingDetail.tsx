import React from 'react';
import { Typography, Box, Button } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';

const MappingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  return (
    <Box>
      <Typography variant="h4" gutterBottom>Mapping Details</Typography>
      <Typography variant="body1">Viewing mapping with ID: {id}</Typography>
      
      <Box mt={3}>
        <Button variant="outlined" onClick={() => navigate(-1)}>
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default MappingDetail;
