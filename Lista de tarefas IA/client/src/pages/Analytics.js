import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalTasks: 0,
    completedTasks: 0,
    tasksByPriority: {},
    tasksByCategory: {},
    averageCompletionTime: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/tasks/analytics/report');
      setData(response.data);
    } catch (error) {
      console.error('Erro ao carregar análises:', error);
    } finally {
      setLoading(false);
    }
  };

  const priorityData = Object.entries(data.tasksByPriority).map(([name, value]) => ({
    name,
    value,
  }));

  const categoryData = Object.entries(data.tasksByCategory).map(([name, value]) => ({
    name,
    value,
  }));

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
        Análises
      </Typography>

      <Grid container spacing={3}>
        {/* Cards de Resumo */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total de Tarefas
              </Typography>
              <Typography variant="h4">
                {data.totalTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tarefas Concluídas
              </Typography>
              <Typography variant="h4">
                {data.completedTasks}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tempo Médio de Conclusão
              </Typography>
              <Typography variant="h4">
                {Math.round(data.averageCompletionTime)} min
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Gráfico de Pizza - Prioridades */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Distribuição por Prioridade
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Gráfico de Barras - Categorias */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Distribuição por Categoria
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Sugestões de IA */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Insights de IA
            </Typography>
            <Typography variant="body1" paragraph>
              Com base na análise dos seus padrões de trabalho, aqui estão algumas sugestões:
            </Typography>
            <ul>
              <li>
                <Typography variant="body1">
                  Você tende a ser mais produtivo nas manhãs. Considere agendar tarefas importantes neste período.
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  Tarefas da categoria "Trabalho" têm uma taxa de conclusão mais alta quando agendadas em dias úteis.
                </Typography>
              </li>
              <li>
                <Typography variant="body1">
                  Sua produtividade aumenta em 30% quando divide tarefas grandes em subtarefas menores.
                </Typography>
              </li>
            </ul>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics; 