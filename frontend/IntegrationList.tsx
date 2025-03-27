// frontend/src/pages/IntegrationList.tsx
import React, { useEffect, useState } from 'react';
import { 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getIntegrations, triggerSync } from '../api/services';
import { Integration } from '../types';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SyncIcon from '@mui/icons-material/Sync';
import ListIcon from '@mui/icons-material/List';

const IntegrationList = () => {
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

  const getStatusChip = (status: string) => {
    let color: 'success' | 'info' | 'warning' | 'error' = 'info';
    
    switch (status) {
      case 'active':
        color = 'success';
        break;
      case 'draft':
        color = 'info';
        break;
      case 'paused':
        color = 'warning';
        break;
      case 'error':
        color = 'error';
        break;
    }
    
    return <Chip label={status} color={color} size="small" />;
  };

  const handleTriggerSync = async (integrationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await triggerSync(integrationId);
      alert('Sync initiated successfully');
    } catch (error) {
      console.error('Error triggering sync:', error);
      alert('Failed to trigger sync');
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4">Integrations</Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/integrations/create')}
        >
          Create New Integration
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Sync Frequency</TableCell>
              <TableCell>Last Sync</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {integrations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No integrations found. Create your first integration!
                </TableCell>
              </TableRow>
            ) : (
              integrations.map((integration) => (
                <TableRow 
                  key={integration._id}
                  hover
                  onClick={() => navigate(`/integrations/${integration._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <TableCell>{integration.name}</TableCell>
                  <TableCell>{integration.sourceConnectorId}</TableCell>
                  <TableCell>{integration.targetConnectorId}</TableCell>
                  <TableCell>{getStatusChip(integration.status)}</TableCell>
                  <TableCell>{integration.syncFrequency}</TableCell>
                  <TableCell>
                    {integration.lastSyncAt 
                      ? new Date(integration.lastSyncAt).toLocaleString() 
                      : 'Never'
                    }
                  </TableCell>
                  <TableCell>
                    <Box display="flex">
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/integrations/${integration._id}`);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Sync Now">
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleTriggerSync(integration._id, e)}
                          color="primary"
                        >
                          <SyncIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="View Mappings">
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/integrations/${integration._id}/mappings`);
                          }}
                        >
                          <ListIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default IntegrationList;
