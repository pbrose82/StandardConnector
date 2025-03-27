import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Dashboard from './pages/Dashboard';
import IntegrationList from './pages/IntegrationList';
import IntegrationDetail from './pages/IntegrationDetail';
import IntegrationCreate from './pages/IntegrationCreate';
import MappingList from './pages/MappingList';
import MappingDetail from './pages/MappingDetail';
import MappingCreate from './pages/MappingCreate';
import NavBar from './components/NavBar';
import SyncLogs from './pages/SyncLogs';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <NavBar />
          <main style={{ padding: '20px' }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/integrations" element={<IntegrationList />} />
              <Route path="/integrations/create" element={<IntegrationCreate />} />
              <Route path="/integrations/:id" element={<IntegrationDetail />} />
              <Route path="/integrations/:integrationId/mappings" element={<MappingList />} />
              <Route path="/integrations/:integrationId/mappings/create" element={<MappingCreate />} />
              <Route path="/mappings/:id" element={<MappingDetail />} />
              <Route path="/integrations/:integrationId/logs" element={<SyncLogs />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
