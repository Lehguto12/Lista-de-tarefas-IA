const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pendente', 'em_andamento', 'concluida'],
    default: 'pendente'
  },
  priority: {
    type: String,
    enum: ['baixa', 'media', 'alta'],
    default: 'media'
  },
  category: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date
  },
  estimatedTime: {
    type: Number, // em minutos
  },
  actualTime: {
    type: Number, // em minutos
  },
  tags: [{
    type: String
  }],
  aiSuggestions: {
    suggestedTime: Date,
    confidence: Number
  },
  googleCalendarEventId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para atualizar o updatedAt
taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Task', taskSchema); 