// frontend/src/pages/IntegrationCreate.tsx
import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Box, 
  TextField, 
  Button, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Grid,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { 
  getConnectorTypes, 
  createIntegration 
} from '../api/services';

const IntegrationCreate = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [connectorTypes, setConnectorTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sourceConnectorId: '',
    targetConnectorId: '',
    syncDirection: 'source_to_target',
    syncFrequency: 'minutes_15',
    status: 'draft'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchConnectorTypes = async () => {
      try {
        setLoading(true);
        const response = await getConnectorTypes();
        setConnectorTypes(response.data);
      } catch (error) {
        console.error('Error fetching connector types:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnectorTypes();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
    
    // Clear error for this field
    if (errors[name as string]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as string];
        return newErrors;
      });
    }
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};
    
    if (activeStep === 0) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      }
    } else if (activeStep === 1) {
      if (!formData.sourceConnectorId) {
        newErrors.sourceConnectorId = 'Source connector is required';
      }
      if (!formData.targetConnectorId) {
        newErrors.targetConnectorId = 'Target connector is required';
      }
      if (formData.sourceConnectorId === formData.targetConnectorId) {
        newErrors.targetConnectorId = 'Source and target cannot be the same';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    
    try {
      const response = await createIntegration(formData);
      navigate(`/integrations/${response.data._id}`);
    } catch (error) {
      console.error('Error creating integration:', error);
      alert('Failed to create integration');
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Basic Information</Typography>
            <TextField
              fullWidth
              margin="normal"
              name="name"
              label="Integration Name"
              value={formData.name}
              onChange={handleChange}
              error={!!errors.name}
              helperText={errors.name}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={3}
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Select Connectors</Typography>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Source System</Typography>
                    <FormControl fullWidth margin="normal" error={!!errors.sourceConnectorId}>
                      <InputLabel>Source Connector</InputLabel>
                      <Select
                        name="sourceConnectorId"
                        value={formData.sourceConnectorId}
                        onChange={handleChange}
                        label="Source Connector"
                      >
                        {connectorTypes.map(type => (
                          <MenuItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.sourceConnectorId && (
                        <FormHelperText>{errors.sourceConnectorId}</FormHelperText>
                      )}
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>Target System</Typography>
                    <FormControl fullWidth margin="normal" error={!!errors.targetConnectorId}>
                      <InputLabel>Target Connector</InputLabel>
                      <Select
                        name="targetConnectorId"
                        value={formData.targetConnectorId}
                        onChange={handleChange}
                        label="Target Connector"
                      >
                        {connectorTypes.map(type => (
                          <MenuItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.targetConnectorId && (
                        <FormHelperText>{errors.targetConnectorId}</FormHelperText>
                      )}
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        );
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Sync Configuration</Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Sync Direction</InputLabel>
              <Select
                name="syncDirection"
                value={formData.syncDirection}
                onChange={handleChange}
                label="Sync Direction"
              >
                <MenuItem value="source_to_target">Source to Target (One-way)</MenuItem>
                <MenuItem value="target_to_source">Target to Source (One-way)</MenuItem>
                <MenuItem value="bidirectional">Bidirectional (Two-way)</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>Sync Frequency</InputLabel>
              <Select
                name="syncFrequency"
                value={formData.syncFrequency}
                onChange={handleChange}
                label="Sync Frequency"
              >
                <MenuItem value="realtime">Real-time (webhook)</MenuItem>
                <MenuItem value="minutes_5">Every 5 minutes</MenuItem>
                <MenuItem value="minutes_15">Every 15 minutes</MenuItem>
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="manual">Manual only</MenuItem>
              </Select>
            </FormControl>
          </Box>
        );
      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Review & Create</Typography>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1">Integration Details</Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">Name:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">{formData.name}</Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">Description:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {formData.description || '(No description)'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">Source:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {formData.sourceConnectorId}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">Target:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {formData.targetConnectorId}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">Sync Direction:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {formData.syncDirection === 'source_to_target' ? 'Source to Target (One-way)' : 
                       formData.syncDirection === 'target_to_source' ? 'Target to Source (One-way)' : 
                       'Bidirectional (Two-way)'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={4}>
                    <Typography variant="body2" color="textSecondary">Sync Frequency:</Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography variant="body1">
                      {formData.syncFrequency === 'realtime' ? 'Real-time (webhook)' :
                       formData.syncFrequency === 'minutes_5' ? 'Every 5 minutes' :
                       formData.syncFrequency === 'minutes_15' ? 'Every 15 minutes' :
                       formData.syncFrequency === 'hourly' ? 'Hourly' :
                       formData.syncFrequency === 'daily' ? 'Daily' : 'Manual only'}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
            
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              After creating the integration, you'll need to configure field mappings.
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Create New Integration</Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        <Step>
          <StepLabel>Basic Info</StepLabel>
        </Step>
        <Step>
          <StepLabel>Select Connectors</StepLabel>
        </Step>
        <Step>
          <StepLabel>Configure Sync</StepLabel>
        </Step>
        <Step>
          <StepLabel>Review</StepLabel>
        </Step>
      </Stepper>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        {renderStepContent()}
      </Paper>
      
      <Box display="flex" justifyContent="space-between">
        <Button 
          variant="outlined" 
          onClick={activeStep === 0 ? () => navigate('/integrations') : handleBack}
        >
          {activeStep === 0 ? 'Cancel' : 'Back'}
        </Button>
        
        <Button 
          variant="contained" 
          color="primary"
          onClick={activeStep === 3 ? handleSubmit : handleNext}
        >
          {activeStep === 3 ? 'Create Integration' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

export default IntegrationCreate;
