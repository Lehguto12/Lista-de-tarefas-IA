const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(auth);

// Criar nova tarefa
router.post('/', taskController.createTask);

// Listar todas as tarefas do usuário
router.get('/', taskController.getTasks);

// Atualizar uma tarefa específica
router.put('/:id', taskController.updateTask);

// Deletar uma tarefa específica
router.delete('/:id', taskController.deleteTask);

// Gerar relatório de produtividade
router.get('/analytics/report', taskController.getProductivityReport);

module.exports = router; 