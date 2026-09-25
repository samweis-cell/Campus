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

// Speicher-System (LocalStorage)
let tasks = JSON.parse(localStorage.getItem('pwa_tasks')) || [];
let exams = JSON.parse(localStorage.getItem('pwa_exams')) || [];

function saveAll() {
  localStorage.setItem('pwa_tasks', JSON.stringify(tasks));
  localStorage.setItem('pwa_exams', JSON.stringify(exams));
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
    return;
  }

  tasks.forEach(task => {
    const item = document.createElement('div');
    item.className = 'task-item';
    item.innerHTML = `
      <input type="checkbox" ${task.done ? 'checked' : ''} onchange="toggleTask(${task.id})">
      <span style="${task.done ? 'text-decoration: line-through; color: gray;' : ''}">${task.title}</span>
    `;
    
    if (!task.done) heuteContainer.appendChild(item.cloneNode(true));
    allContainer.appendChild(item);
  });
}

function toggleTask(id) {
  tasks = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
  saveAll();
  renderTasks();
}

function addTaskPrompt() {
  const title = prompt('Neue Aufgabe eingeben:');
  if (title) {
    tasks.push({ id: Date.now(), title, done: false });
    saveAll();
    renderTasks();
  }
}

// Initialisieren
renderTasks();
