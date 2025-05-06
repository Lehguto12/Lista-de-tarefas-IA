import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Assignment as TaskIcon,
  CheckCircle as CompletedIcon,
  Schedule as PendingIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    productivity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksResponse, statsResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/tasks'),
          axios.get('http://localhost:5000/api/tasks/analytics/report'),
        ]);

        setTasks(tasksResponse.data);
        setStats({
          total: statsResponse.data.totalTasks,
          completed: statsResponse.data.completedTasks,
          pending: statsResponse.data.totalTasks - statsResponse.data.completedTasks,
          productivity: (statsResponse.data.completedTasks / statsResponse.data.totalTasks) * 100 || 0,
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta':
        return 'error';
      case 'media':
        return 'warning';
      case 'baixa':
        return 'success';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={3}>
        {/* Cards de Estatísticas */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total de Tarefas
              </Typography>
              <Typography variant="h4">
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tarefas Concluídas
              </Typography>
              <Typography variant="h4">
                {stats.completed}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tarefas Pendentes
              </Typography>
              <Typography variant="h4">
                {stats.pending}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Produtividade
              </Typography>
              <Typography variant="h4">
                {stats.productivity.toFixed(1)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Lista de Tarefas Recentes */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tarefas Recentes
            </Typography>
            <List>
              {tasks.slice(0, 5).map((task) => (
                <ListItem key={task._id}>
                  <ListItemIcon>
                    {task.status === 'concluida' ? (
                      <CompletedIcon color="success" />
                    ) : (
                      <PendingIcon color="action" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={task.title}
                    secondary={format(new Date(task.createdAt), "dd 'de' MMMM 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  />
                  <Chip
                    label={task.priority}
                    color={getPriorityColor(task.priority)}
                    size="small"
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Sugestões de IA */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sugestões de IA
            </Typography>
            <List>
              {tasks
                .filter((task) => task.aiSuggestions)
                .slice(0, 3)
                .map((task) => (
                  <ListItem key={task._id}>
                    <ListItemIcon>
                      <TrendingIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`Sugestão para: ${task.title}`}
                      secondary={`Horário sugerido: ${format(
                        new Date(task.aiSuggestions.suggestedTime),
                        "dd 'de' MMMM 'às' HH:mm",
                        { locale: ptBR }
                      )}`}
                    />
                  </ListItem>
                ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 