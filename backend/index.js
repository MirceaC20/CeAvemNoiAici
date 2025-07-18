const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const cors = require('cors');
const app = express();
const server = http.createServer(app);        // create raw HTTP server
const io = new Server(server, {
  cors: {
    origin: '*',  // Or specify your frontend URL
    methods: ['GET', 'POST']
  }
});

// Make `io` accessible to routes
app.set('io', io);
const PORT = 3000;

const usedQuestions = './used-questions.json';
const allQuestions = './questions.json';
const scoreboardFile = './scoreboard.json';

app.use(cors());
app.use(express.json());

let currentQuestionIndex = null;
let questions = null;

// Load used questions
app.get('/api/used', (req, res) => {
  try {
    const data = fs.readFileSync(usedQuestions, 'utf8');
    const json = JSON.parse(data);
    res.json(json);
  } catch (err) {
    console.error('Error reading used questions:', err);
    res.status(500).json({ error: 'Failed to load used questions' });
  }
});

app.get('/api/questions', (req, res) => {
  try {
    const data = fs.readFileSync(allQuestions, 'utf8');
    questions = JSON.parse(data);
    res.json(questions);
  } catch (err) {
    console.error('Error reading all questions:', err);
    res.status(500).json({ error: 'Failed to load all questions' });
  }
});

app.get('/api/questions/:questionIndex/reveal/:answerIndex', (req, res) => {
  try {
    const io = req.app.get('io');

    const answerIndex = parseInt(req.params.answerIndex, 10);
    const questionIndex = parseInt(req.params.questionIndex, 10);

    io.emit('reveal-answer', { questionIndex, answerIndex });

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Error emitting reveal-answer:', err);
    res.status(500).json({ error: 'Failed to emit answer reveal event' });
  }
});

app.get('/api/current-question', (req, res) => {
  if (currentQuestionIndex === null) {
    return res.status(404).json({ error: 'No current question set' });
  }

  try {
    const data = fs.readFileSync(allQuestions, 'utf8');
    const questions = JSON.parse(data);

    const question = questions.find(q => q.index === currentQuestionIndex);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(question);
  } catch (err) {
    console.error('❌ Error loading current question:', err);
    res.status(500).json({ error: 'Failed to load current question' });
  }
});

app.get('/api/question/:qIndex', (req, res) => {
  try {
    console.log(req.params.qIndex);

    const questionIndex = parseInt(req.params.qIndex);
    console.log(questionIndex);

    if (isNaN(questionIndex)) {
      return res.status(400).json({ error: 'Invalid index for wrong answer' });
    }

    const data = fs.readFileSync(allQuestions, 'utf8');
    const questions = JSON.parse(data);

    const question = questions.find(q => q.index === questionIndex);

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(question);
  } catch (err) {
    console.error('❌ Error loading current question:', err);
    res.status(500).json({ error: 'Failed to load current question' });
  }
});

app.get('/api/current-question/:index/wrong', (req, res) => {
  try {
    const io = req.app.get('io');
    const answerIndex = parseInt(req.params.index, 10);

    if (isNaN(answerIndex)) {
      return res.status(400).json({ error: 'Invalid index for wrong answer' });
    }

    // Emit to all clients: this will be handled by FE
    io.emit('wrong-answer', { answerIndex });

    res.status(200).json({ success: true, message: `Wrong answer triggered for index ${answerIndex}` });
  } catch (err) {
    console.error('❌ Error emitting wrong-answer event:', err);
    res.status(500).json({ error: 'Failed to emit wrong answer event' });
  }
});

app.get('/api/current-question/:index/wrong-no-count', (req, res) => {
  try {
    const io = req.app.get('io');
    const answerIndex = parseInt(req.params.index, 10);

    if (isNaN(answerIndex)) {
      return res.status(400).json({ error: 'Invalid index for wrong answer' });
    }

    // Emit to all clients: this will be handled by FE
    io.emit('wrong-answer-no-count', { answerIndex });

    res.status(200).json({ success: true, message: `Wrong answer triggered for index ${answerIndex}` });
  } catch (err) {
    console.error('❌ Error emitting wrong-answer event:', err);
    res.status(500).json({ error: 'Failed to emit wrong answer event' });
  }
});

app.post('/api/score', (req, res) => {
  const { teamName, score } = req.body;

  if (typeof teamName !== 'string' || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid teamName or score' });
  }

  try {
    let data = { teams: [] };
    if (fs.existsSync(scoreboardFile)) {
      const raw = fs.readFileSync(scoreboardFile, 'utf8');
      data = JSON.parse(raw);
    }

    const existingTeam = data.teams.find(t => t.name === teamName);

    if (existingTeam) {
      existingTeam.scores.push(score);
    } else {
      data.teams.push({ name: teamName, scores: [score] });
    }

    fs.writeFileSync(scoreboardFile, JSON.stringify(data, null, 2));
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error saving score:', err);
    res.status(500).json({ error: 'Failed to save score' });
  }
});

app.get('/api/scoreboard', (req, res) => {
  try {
    if (!fs.existsSync(scoreboardFile)) {
      return res.json({ teams: [] });
    }

    const data = fs.readFileSync(scoreboardFile, 'utf8');
    const json = JSON.parse(data);
    res.json(json);
  } catch (err) {
    console.error('❌ Error reading scoreboard:', err);
    res.status(500).json({ error: 'Failed to read scoreboard' });
  }
});

app.get('/api/used-team-names', (req, res) => {
  try {
    const scoreboardFile = './scoreboard.json';

    if (!fs.existsSync(scoreboardFile)) {
      return res.json({ usedTeamNames: [] });
    }

    const data = fs.readFileSync(scoreboardFile, 'utf8');
    const json = JSON.parse(data);

    const usedTeamNames = json.teams.map(team => team.name);
    res.json({ usedTeamNames });
  } catch (err) {
    console.error('❌ Error reading team names from scoreboard:', err);
    res.status(500).json({ error: 'Failed to read used team names' });
  }
});


app.post('/api/used', (req, res) => {
  const { index } = req.body;

  if (typeof index !== 'number') {
    return res.status(400).json({ error: 'Index must be a number' });
  }

  try {
    const data = fs.readFileSync(usedQuestions, 'utf8');
    const json = JSON.parse(data);

    if (!json.usedQuestionIndexes.includes(index)) {
      json.usedQuestionIndexes.push(index);
      fs.writeFileSync(usedQuestions, JSON.stringify(json, null, 2));
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error saving used question:', err);
    res.status(500).json({ error: 'Failed to save used question' });
  }
});

app.post('/api/current-question', (req, res) => {
  const { index } = req.body;

  if (typeof index !== 'number') {
    return res.status(400).json({ error: 'Index must be a number' });
  }
    
  try {
    currentQuestionIndex = index;

  } catch (err) {
    console.error('Error saving current question index:', err);
    res.status(500).json({ error: 'Failed to save used question' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend + Socket.IO running at http://0.0.0.0:${PORT}`);
});