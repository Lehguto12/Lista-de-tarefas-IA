import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Paper, TextField, Button, Grid, MenuItem,
  FormControl, InputLabel, Select, CircularProgress, Alert
} from '@mui/material';
import axios from 'axios';

const toLocalDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const TaskForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [task, setTask] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'media',
    status: 'pendente',
    dueDate: toLocalDateTime(new Date()),
    estimatedTime: '',
    tags: '',
  });

  useEffect(() => {
    if (id) fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/tasks/${id}`);
      const taskData = response.data;
      setTask({
        ...taskData,
        dueDate: toLocalDateTime(taskData.dueDate),
        tags: Array.isArray(taskData.tags) ? taskData.tags.join(', ') : '',
      });
    } catch (error) {
      setError('Erro ao carregar tarefa');
      console.error('Erro ao carregar tarefa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const taskData = {
        ...task,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
        estimatedTime: task.estimatedTime === '' ? undefined : Number(task.estimatedTime),
        tags: task.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      };

      if (id) {
        await axios.put(`http://localhost:5000/api/tasks/${id}`, taskData);
      } else {
        await axios.post('http://localhost:5000/api/tasks', taskData);
      }

      navigate('/tasks');
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao salvar tarefa');
      console.error('Erro ao salvar tarefa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
  };

  if (loading && id) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{id ? 'Editar Tarefa' : 'Nova Tarefa'}</Typography>
      <Paper sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField fullWidth required label="Título" name="title" value={task.title} onChange={handleChange} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={4} label="Descrição" name="description" value={task.description} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth required label="Categoria" name="category" value={task.category} onChange={handleChange} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select name="priority" value={task.priority} onChange={handleChange} label="Prioridade">
                  <MenuItem value="baixa">Baixa</MenuItem>
                  <MenuItem value="media">Média</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select name="status" value={task.status} onChange={handleChange} label="Status">
                  <MenuItem value="pendente">Pendente</MenuItem>
                  <MenuItem value="em_andamento">Em Andamento</MenuItem>
                  <MenuItem value="concluida">Concluída</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth type="number" label="Tempo Estimado (minutos)" name="estimatedTime" value={task.estimatedTime} onChange={handleChange} inputProps={{ min: 0 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Data de Entrega"
                name="dueDate"
                value={task.dueDate}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Tags (separadas por vírgula)" name="tags" value={task.tags} onChange={handleChange} helperText="Ex: trabalho, pessoal, urgente" />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => navigate('/tasks')}>Cancelar</Button>
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? <CircularProgress size={24} /> : 'Salvar'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default TaskForm;
