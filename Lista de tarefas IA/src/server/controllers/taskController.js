const Task = require('../models/Task');
const { Configuration, OpenAIApi } = require('openai');
const { google } = require('googleapis');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Função para classificar a prioridade da tarefa usando IA
async function classifyTaskPriority(taskDescription) {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Classifique a seguinte tarefa como 'baixa', 'media' ou 'alta' prioridade: ${taskDescription}`,
      max_tokens: 10,
      temperature: 0.3,
    });

    const priority = response.data.choices[0].text.trim().toLowerCase();
    return priority;
  } catch (error) {
    console.error('Erro ao classificar prioridade:', error);
    return 'media';
  }
}

// Função para sugerir horário ideal usando IA
async function suggestOptimalTime(taskDescription, userSchedule) {
  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `Sugira o melhor horário para a seguinte tarefa, considerando o horário do usuário: ${taskDescription}. Horário disponível: ${JSON.stringify(userSchedule)}`,
      max_tokens: 50,
      temperature: 0.7,
    });

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Erro ao sugerir horário:', error);
    return null;
  }
}

// Criar nova tarefa
exports.createTask = async (req, res) => {
  try {
    const { title, description, category, dueDate } = req.body;
    
    // Classificar prioridade usando IA
    const priority = await classifyTaskPriority(description);
    
    // Sugerir horário ideal
    const suggestedTime = await suggestOptimalTime(description, req.user.schedule);

    const task = new Task({
      title,
      description,
      category,
      dueDate,
      priority,
      user: req.user.id,
      aiSuggestions: {
        suggestedTime,
        confidence: 0.8
      }
    });

    await task.save();

    // Integrar com Google Calendar
    if (process.env.GOOGLE_CALENDAR_ENABLED === 'true') {
      const calendar = google.calendar({ version: 'v3', auth: req.user.googleAuth });
      const event = {
        summary: title,
        description,
        start: {
          dateTime: suggestedTime || dueDate,
        },
        end: {
          dateTime: new Date(new Date(suggestedTime || dueDate).getTime() + 60 * 60 * 1000), // 1 hora depois
        },
      };

      const calendarEvent = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
      });

      task.googleCalendarEventId = calendarEvent.data.id;
      await task.save();
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar tarefa', error: error.message });
  }
};

// Listar tarefas do usuário
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id })
      .sort({ priority: -1, dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar tarefas', error: error.message });
  }
};

// Atualizar tarefa
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar tarefa', error: error.message });
  }
};

// Deletar tarefa
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    // Remover do Google Calendar se existir
    if (task.googleCalendarEventId && process.env.GOOGLE_CALENDAR_ENABLED === 'true') {
      const calendar = google.calendar({ version: 'v3', auth: req.user.googleAuth });
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: task.googleCalendarEventId,
      });
    }

    res.json({ message: 'Tarefa removida com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar tarefa', error: error.message });
  }
};

// Gerar relatório de produtividade
exports.getProductivityReport = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    
    const report = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'concluida').length,
      averageCompletionTime: tasks.reduce((acc, task) => acc + (task.actualTime || 0), 0) / tasks.length,
      tasksByPriority: {
        alta: tasks.filter(t => t.priority === 'alta').length,
        media: tasks.filter(t => t.priority === 'media').length,
        baixa: tasks.filter(t => t.priority === 'baixa').length,
      },
      tasksByCategory: tasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao gerar relatório', error: error.message });
  }
}; 