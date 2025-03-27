// frontend/src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  Box, 
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getIntegrations } from '../api/services';
import { Integration } from '../types';

const Dashboard = () => {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getIntegrations();
        setIntegrations(response.data);
      } catch (error) {
        console.error('Error fetching integrations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusCount = (status: string) => {
    return integrations.filter(integration => integration.status === status).length;
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Integration Dashboard</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/integrations/create')}
        >
          Create New Integration
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Status Summary */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Integration Status</Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{getStatusCount('active')}</Typography>
                      <Typography>Active</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{getStatusCount('draft')}</Typography>
                      <Typography>Draft</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{getStatusCount('paused')}</Typography>
                      <Typography>Paused</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6}>
                  <Card sx={{ bgcolor: 'error.light', color: 'white' }}>
                    <CardContent>
                      <Typography variant="h4">{getStatusCount('error')}</Typography>
                      <Typography>Error</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Integrations */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Recent Integrations</Typography>
              {integrations.length === 0 ? (
                <Typography variant="body1">No integrations found. Create your first integration!</Typography>
              ) : (
                <List>
                  {integrations.slice(0, 5).map((integration) => (
                    <React.Fragment key={integration._id}>
                      <ListItem 
                        button 
                        onClick={() => navigate(`/integrations/${integration._id}`)}
                      >
                        <ListItemText 
                          primary={integration.name} 
                          secondary={`Status: ${integration.status} | Last updated: ${new Date(integration.updatedAt).toLocaleString()}`} 
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
