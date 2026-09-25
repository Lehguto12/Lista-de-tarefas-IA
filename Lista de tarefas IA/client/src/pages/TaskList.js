import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Button, TextField, MenuItem, Grid, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'todos', priority: 'todos', search: '' });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, taskId: null });
  const navigate = useNavigate();

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tasks');
      setTasks(response.data);
    } catch (error) {
      console.error('Erro ao carregar tarefas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/tasks/${deleteDialog.taskId}`);
      setTasks(current => current.filter(task => task._id !== deleteDialog.taskId));
      setDeleteDialog({ open: false, taskId: null });
    } catch (error) {
      console.error('Erro ao deletar tarefa:', error);
    }
  };

  const getPriorityColor = (priority) => ({ alta: 'error', media: 'warning', baixa: 'success' }[priority] || 'default');
  const getStatusColor = (status) => ({ concluida: 'success', em_andamento: 'warning', pendente: 'error' }[status] || 'default');

  const filteredTasks = tasks.filter(task => {
    const title = String(task.title || '').toLowerCase();
    const description = String(task.description || '').toLowerCase();
    const search = filter.search.toLowerCase();
    return (
      (filter.status === 'todos' || task.status === filter.status) &&
      (filter.priority === 'todos' || task.priority === filter.priority) &&
      (title.includes(search) || description.includes(search))
    );
  });

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Tarefas</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/tasks/new')}>Nova Tarefa</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Buscar" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth select label="Status" value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="pendente">Pendente</MenuItem>
              <MenuItem value="em_andamento">Em Andamento</MenuItem>
              <MenuItem value="concluida">Concluída</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth select label="Prioridade" value={filter.priority} onChange={(e) => setFilter({ ...filter, priority: e.target.value })}>
              <MenuItem value="todos">Todas</MenuItem>
              <MenuItem value="alta">Alta</MenuItem>
              <MenuItem value="media">Média</MenuItem>
              <MenuItem value="baixa">Baixa</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <List>
          {filteredTasks.length === 0 && (
            <ListItem><ListItemText primary="Nenhuma tarefa encontrada." /></ListItem>
          )}
          {filteredTasks.map((task) => (
            <ListItem key={task._id} divider sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
              <ListItemText
                primary={task.title}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="textPrimary">
                      {task.description || 'Sem descrição'}
                    </Typography>
                    <br />
                    {task.createdAt && format(new Date(task.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                  </>
                }
              />
              <ListItemSecondaryAction>
                <Chip label={task.priority} color={getPriorityColor(task.priority)} size="small" sx={{ mr: 1 }} />
                <Chip label={task.status} color={getStatusColor(task.status)} size="small" sx={{ mr: 1 }} />
                <IconButton edge="end" aria-label="edit" onClick={() => navigate(`/tasks/${task._id}`)}><EditIcon /></IconButton>
                <IconButton edge="end" aria-label="delete" onClick={() => setDeleteDialog({ open: true, taskId: task._id })}><DeleteIcon /></IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, taskId: null })}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent><Typography>Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, taskId: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error">Excluir</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskList;
