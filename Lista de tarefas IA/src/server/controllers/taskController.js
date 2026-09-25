const Task = require('../models/Task');
const OpenAI = require('openai');
const { google } = require('googleapis');

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

async function classifyTaskPriority(taskDescription = '') {
  if (!openai || !taskDescription.trim()) return 'media';

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Classifique tarefas somente como baixa, media ou alta. Responda com uma única palavra.'
        },
        { role: 'user', content: taskDescription }
      ],
      temperature: 0
    });

    const priority = response.choices?.[0]?.message?.content?.trim().toLowerCase();
    return ['baixa', 'media', 'alta'].includes(priority) ? priority : 'media';
  } catch (error) {
    console.error('Erro ao classificar prioridade:', error.message);
    return 'media';
  }
}

async function suggestOptimalTime(taskDescription = '', userSchedule = {}) {
  if (!openai || !taskDescription.trim()) return null;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Sugira um horário no formato ISO 8601. Considere o horário de trabalho informado. Responda somente com uma data/hora ISO válida ou NULL.'
        },
        {
          role: 'user',
          content: `Tarefa: ${taskDescription}\nHorário disponível: ${JSON.stringify(userSchedule)}\nData atual: ${new Date().toISOString()}`
        }
      ],
      temperature: 0.2
    });

    const value = response.choices?.[0]?.message?.content?.trim();
    if (!value || value.toUpperCase() === 'NULL') return null;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.error('Erro ao sugerir horário:', error.message);
    return null;
  }
}

function getGoogleCalendarClient(user) {
  if (!user?.googleAuth?.accessToken) return null;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: user.googleAuth.accessToken,
    refresh_token: user.googleAuth.refreshToken,
    expiry_date: user.googleAuth.expiryDate
  });

  return oauth2Client;
}

exports.createTask = async (req, res) => {
  try {
    const { title, description = '', category, dueDate, estimatedTime, tags = [] } = req.body;

    if (!title || !category) {
      return res.status(400).json({ message: 'Título e categoria são obrigatórios' });
    }

    const priority = req.body.priority || await classifyTaskPriority(description);
    const suggestedTime = await suggestOptimalTime(description, req.user.schedule);

    const task = new Task({
      title,
      description,
      category,
      dueDate,
      estimatedTime,
      tags,
      priority,
      status: req.body.status || 'pendente',
      user: req.user.id,
      aiSuggestions: {
        suggestedTime,
        confidence: suggestedTime ? 0.8 : 0
      }
    });

    await task.save();

    if (process.env.GOOGLE_CALENDAR_ENABLED === 'true' && dueDate) {
      const authClient = getGoogleCalendarClient(req.user);
      if (authClient) {
        const calendar = google.calendar({ version: 'v3', auth: authClient });
        const start = new Date(dueDate);
        const event = await calendar.events.insert({
          calendarId: 'primary',
          resource: {
            summary: title,
            description,
            start: { dateTime: start.toISOString() },
            end: { dateTime: new Date(start.getTime() + 60 * 60 * 1000).toISOString() }
          }
        });

        task.googleCalendarEventId = event.data.id;
        await task.save();
      }
    }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar tarefa', error: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id }).sort({ priority: -1, dueDate: 1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao buscar tarefas', error: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: 'ID de tarefa inválido' });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const updates = { ...req.body, updatedAt: Date.now() };
    delete updates.user;
    delete updates._id;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: 'Erro ao atualizar tarefa', error: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!task) {
      return res.status(404).json({ message: 'Tarefa não encontrada' });
    }

    if (task.googleCalendarEventId && process.env.GOOGLE_CALENDAR_ENABLED === 'true') {
      const authClient = getGoogleCalendarClient(req.user);
      if (authClient) {
        const calendar = google.calendar({ version: 'v3', auth: authClient });
        await calendar.events.delete({
          calendarId: 'primary',
          eventId: task.googleCalendarEventId
        });
      }
    }

    res.json({ message: 'Tarefa removida com sucesso' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao deletar tarefa', error: error.message });
  }
};

exports.getProductivityReport = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id });
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'concluida').length;

    const report = {
      totalTasks,
      completedTasks,
      averageCompletionTime: totalTasks
        ? tasks.reduce((acc, task) => acc + (task.actualTime || 0), 0) / totalTasks
        : 0,
      tasksByPriority: {
        alta: tasks.filter(t => t.priority === 'alta').length,
        media: tasks.filter(t => t.priority === 'media').length,
        baixa: tasks.filter(t => t.priority === 'baixa').length
      },
      tasksByCategory: tasks.reduce((acc, task) => {
        const category = task.category || 'Sem categoria';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {})
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao gerar relatório', error: error.message });
  }
};
