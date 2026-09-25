import React, { useState, useEffect } from 'react';
import { Grid, Paper, Typography, Box, Card, CardContent, List, ListItem, ListItemText, ListItemIcon, Chip, CircularProgress } from '@mui/material';
import { CheckCircle as CompletedIcon, Schedule as PendingIcon, TrendingUp as TrendingIcon } from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, productivity: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksResponse, statsResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/tasks'),
          axios.get('http://localhost:5000/api/tasks/analytics/report'),
        ]);

        setTasks(tasksResponse.data);
        const total = statsResponse.data.totalTasks || 0;
        const completed = statsResponse.data.completedTasks || 0;
        setStats({
          total,
          completed,
          pending: Math.max(total - completed, 0),
          productivity: total ? (completed / total) * 100 : 0,
        });
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getPriorityColor = (priority) => ({ alta: 'error', media: 'warning', baixa: 'success' }[priority] || 'default');

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  const aiTasks = tasks
    .filter(task => task.aiSuggestions?.suggestedTime && !Number.isNaN(new Date(task.aiSuggestions.suggestedTime).getTime()))
    .slice(0, 3);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Dashboard</Typography>
      <Grid container spacing={3}>
        {[
          ['Total de Tarefas', stats.total],
          ['Tarefas Concluídas', stats.completed],
          ['Tarefas Pendentes', stats.pending],
          ['Produtividade', `${stats.productivity.toFixed(1)}%`],
        ].map(([label, value]) => (
          <Grid item xs={12} md={3} key={label}>
            <Card><CardContent><Typography color="textSecondary" gutterBottom>{label}</Typography><Typography variant="h4">{value}</Typography></CardContent></Card>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Tarefas Recentes</Typography>
            <List>
              {tasks.slice(0, 5).map(task => (
                <ListItem key={task._id}>
                  <ListItemIcon>{task.status === 'concluida' ? <CompletedIcon color="success" /> : <PendingIcon color="action" />}</ListItemIcon>
                  <ListItemText
                    primary={task.title}
                    secondary={task.createdAt ? format(new Date(task.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR }) : 'Sem data'}
                  />
                  <Chip label={task.priority} color={getPriorityColor(task.priority)} size="small" />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Sugestões de IA</Typography>
            {aiTasks.length ? (
              <List>
                {aiTasks.map(task => (
                  <ListItem key={task._id}>
                    <ListItemIcon><TrendingIcon color="primary" /></ListItemIcon>
                    <ListItemText
                      primary={`Sugestão para: ${task.title}`}
                      secondary={`Horário sugerido: ${format(new Date(task.aiSuggestions.suggestedTime), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography color="text.secondary">Nenhuma sugestão de horário disponível no momento.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
