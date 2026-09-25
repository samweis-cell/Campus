// Datum oben anzeigen
document.getElementById('header-date').innerText = new Date().toLocaleDateString('de-DE', { 
  weekday: 'short', day: 'numeric', month: 'short' 
});

// Navigation zwischen den Tabs
function switchTab(tabId, btn) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  
  document.getElementById(`tab-${tabId}`).classList.add('active');
  btn.classList.add('active');
  
  const titles = { 
    heute: 'Heute', 
    stundenplan: 'Stundenplan', 
    aufgaben: 'Aufgaben', 
    arbeiten: 'Arbeiten', 
    noten: 'Noten' 
  };
  document.getElementById('header-title').innerText = titles[tabId];
}

// Lokaler Speicher
let tasks = JSON.parse(localStorage.getItem('pwa_tasks')) || [];
let exams = JSON.parse(localStorage.getItem('pwa_exams')) || [];
let grades = JSON.parse(localStorage.getItem('pwa_grades')) || [];
let schedule = JSON.parse(localStorage.getItem('pwa_schedule')) || [];

function saveAll() {
  localStorage.setItem('pwa_tasks', JSON.stringify(tasks));
  localStorage.setItem('pwa_exams', JSON.stringify(exams));
  localStorage.setItem('pwa_grades', JSON.stringify(grades));
  localStorage.setItem('pwa_schedule', JSON.stringify(schedule));
}

// --- AUFGABEN ---
function renderTasks() {
  const heuteContainer = document.getElementById('heute-tasks');
  const allContainer = document.getElementById('all-tasks');
  
  heuteContainer.innerHTML = '';
  allContainer.innerHTML = '';

  if (tasks.length === 0) {
    heuteContainer.innerHTML = '<p style="color: gray;">Keine Aufgaben offen 🎉</p>';
    allContainer.innerHTML = '<p style="color: gray;">Keine Aufgaben vorhanden.</p>';
  } else {
    tasks.forEach(task => {
      const item = document.createElement('div');
      item.className = 'task-item';
      item.innerHTML = `
        <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleTask(${task.id})">
        <span style="${task.done ? 'text-decoration: line-through; color: gray;' : ''}">${task.title}</span>
        <button style="margin-left:auto; border:none; background:none; color:red;" onclick="deleteTask(${task.id})">🗑️</button>
      `;
      
      if (!task.done) heuteContainer.appendChild(item.cloneNode(true));
      allContainer.appendChild(item);
    });
  }
}

function addTaskPrompt() {
  const title = prompt('Neue Aufgabe eingeben:');
  if (title) {
    tasks.push({ id: Date.now(), title, done: false });
    saveAll();
    renderTasks();
  }
}

function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveAll();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveAll();
  renderTasks();
}

// --- NOTEN ---
function renderGrades() {
  const container = document.getElementById('grades-list');
  const avgElement = document.getElementById('grade-average');
  container.innerHTML = '';

  if (grades.length === 0) {
    container.innerHTML = '<p style="color: gray;">Noch keine Noten eingetragen.</p>';
    avgElement.innerText = '-';
    return;
  }

  let totalSum = 0;
  grades.forEach(g => totalSum += Number(g.value));
  const avg = (totalSum / grades.length).toFixed(2);
  avgElement.innerText = avg;

  grades.forEach(g => {
    const item = document.createElement('div');
    item.className = 'task-item';
    item.innerHTML = `
      <strong>${g.subject}:</strong> Note ${g.value}
      <button style="margin-left:auto; border:none; background:none; color:red;" onclick="deleteGrade(${g.id})">🗑️</button>
    `;
    container.appendChild(item);
  });
}

function addGradePrompt() {
  const subject = prompt('Fach (z.B. Mathe):');
  if (!subject) return;
  const value = prompt('Note (z.B. 1 oder 2.3):');
  if (value) {
    grades.push({ id: Date.now(), subject, value: parseFloat(value) });
    saveAll();
    renderGrades();
  }
}

function deleteGrade(id) {
  grades = grades.filter(g => g.id !== id);
  saveAll();
  renderGrades();
}

// --- STUNDENPLAN ---
function renderSchedule() {
  const container = document.getElementById('schedule-list');
  container.innerHTML = '';

  if (schedule.length === 0) {
    container.innerHTML = '<p style="color: gray;">Keine Stunden eingetragen.</p>';
    return;
  }

  schedule.sort((a,b) => a.time.localeCompare(b.time));

  schedule.forEach(s => {
    const item = document.createElement('div');
    item.className = 'task-item';
    item.innerHTML = `
      <div>
        <strong>${s.time} - ${s.subject}</strong><br>
        <small>Raum ${s.room} (${s.day})</small>
      </div>
      <button style="margin-left:auto; border:none; background:none; color:red;" onclick="deleteSchedule(${s.id})">🗑️</button>
    `;
    container.appendChild(item);
  });
}

function addScheduleItem() {
  const day = prompt('Wochentag (z.B. Mo, Di, Mi):', 'Mo');
  const time = prompt('Uhrzeit (z.B. 08:00):', '08:00');
  const subject = prompt('Fach (z.B. Mathe):');
  const room = prompt('Raum (z.B. 204):', '204');

  if (day && time && subject) {
    schedule.push({ id: Date.now(), day, time, subject, room });
    saveAll();
    renderSchedule();
  }
}

function deleteSchedule(id) {
  schedule = schedule.filter(s => s.id !== id);
  saveAll();
  renderSchedule();
}

// --- ARBEITEN ---
function renderExams() {
  const container = document.getElementById('exam-list');
  container.innerHTML = '';

  if (exams.length === 0) {
    container.innerHTML = '<p style="color: gray;">Keine Arbeiten eingetragen.</p>';
    return;
  }

  exams.forEach(e => {
    const item = document.createElement('div');
    item.className = 'exam-item';
    item.innerHTML = `
      <div>
        <strong>🧪 ${e.subject}</strong> - ${e.date}<br>
        <small>Themen: ${e.topics}</small>
      </div>
      <button style="margin-left:auto; border:none; background:none; color:red;" onclick="deleteExam(${e.id})">🗑️</button>
    `;
    container.appendChild(item);
  });
}

function addExamPrompt() {
  const subject = prompt('Fach der Arbeit:');
  const date = prompt('Datum (z.B. 15. Okt):');
  const topics = prompt('Themen:');

  if (subject && date) {
    exams.push({ id: Date.now(), subject, date, topics });
    saveAll();
    renderExams();
  }
}

function deleteExam(id) {
  exams = exams.filter(e => e.id !== id);
  saveAll();
  renderExams();
}

// Alles initial laden
renderTasks();
renderGrades();
renderSchedule();
renderExams();
