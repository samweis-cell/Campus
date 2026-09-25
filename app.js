document.addEventListener('DOMContentLoaded', () => {
  // Datum oben anzeigen
  const dateElem = document.getElementById('header-date');
  if (dateElem) {
    dateElem.innerText = new Date().toLocaleDateString('de-DE', { 
      weekday: 'short', day: 'numeric', month: 'short' 
    });
  }

  // Navigation Setup
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      
      const targetTab = document.getElementById(`tab-${tabId}`);
      if (targetTab) targetTab.classList.add('active');
      btn.classList.add('active');
      
      const titles = { heute: 'Heute', stundenplan: 'Stundenplan', aufgaben: 'Aufgaben', arbeiten: 'Arbeiten', noten: 'Noten' };
      document.getElementById('header-title').innerText = titles[tabId] || 'Schul-Planer';
    });
  });

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
    
    if (heuteContainer) heuteContainer.innerHTML = '';
    if (allContainer) allContainer.innerHTML = '';

    if (tasks.length === 0) {
      if (heuteContainer) heuteContainer.innerHTML = '<p style="color: gray;">Keine Aufgaben offen 🎉</p>';
      if (allContainer) allContainer.innerHTML = '<p style="color: gray;">Keine Aufgaben vorhanden.</p>';
      return;
    }

    tasks.forEach(task => {
      const item = document.createElement('div');
      item.className = 'task-item';
      item.innerHTML = `
        <input type="checkbox" ${task.done ? 'checked' : ''} data-id="${task.id}">
        <span style="${task.done ? 'text-decoration: line-through; color: gray;' : ''}">${task.title}</span>
        <button style="margin-left:auto; border:none; background:none; color:red;" data-delete="${task.id}">🗑️</button>
      `;

      item.querySelector('input').addEventListener('change', () => {
        task.done = !task.done;
        saveAll();
        renderTasks();
      });

      item.querySelector('button').addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== task.id);
        saveAll();
        renderTasks();
      });

      if (allContainer) allContainer.appendChild(item);
      if (!task.done && heuteContainer) heuteContainer.appendChild(item.cloneNode(true));
    });
  }

  const btnAddTask = document.getElementById('btn-add-task');
  if (btnAddTask) {
    btnAddTask.addEventListener('click', () => {
      const title = window.prompt('Neue Aufgabe eingeben:');
      if (title && title.trim() !== '') {
        tasks.push({ id: Date.now(), title: title.trim(), done: false });
        saveAll();
        renderTasks();
      }
    });
  }

  // --- NOTEN ---
  function renderGrades() {
    const container = document.getElementById('grades-list');
    const avgElement = document.getElementById('grade-average');
    if (!container || !avgElement) return;

    container.innerHTML = '';

    if (grades.length === 0) {
      container.innerHTML = '<p style="color: gray;">Noch keine Noten eingetragen.</p>';
      avgElement.innerText = '-';
      return;
    }

    let totalSum = 0;
    grades.forEach(g => totalSum += Number(g.value));
    avgElement.innerText = (totalSum / grades.length).toFixed(2);

    grades.forEach(g => {
      const item = document.createElement('div');
      item.className = 'task-item';
      item.innerHTML = `
        <strong>${g.subject}:</strong> Note ${g.value}
        <button style="margin-left:auto; border:none; background:none; color:red;">🗑️</button>
      `;

      item.querySelector('button').addEventListener('click', () => {
        grades = grades.filter(itemGrade => itemGrade.id !== g.id);
        saveAll();
        renderGrades();
      });

      container.appendChild(item);
    });
  }

  const btnAddGrade = document.getElementById('btn-add-grade');
  if (btnAddGrade) {
    btnAddGrade.addEventListener('click', () => {
      const subject = window.prompt('Fach (z.B. Mathe):');
      if (!subject) return;
      const value = window.prompt('Note (z.B. 1 oder 2.3):');
      if (value) {
        grades.push({ id: Date.now(), subject: subject.trim(), value: parseFloat(value) });
        saveAll();
        renderGrades();
      }
    });
  }

  // --- STUNDENPLAN ---
  function renderSchedule() {
    const container = document.getElementById('schedule-list');
    if (!container) return;
    container.innerHTML = '';

    if (schedule.length === 0) {
      container.innerHTML = '<p style="color: gray;">Keine Stunden eingetragen.</p>';
      return;
    }

    schedule.forEach(s => {
      const item = document.createElement('div');
      item.className = 'task-item';
      item.innerHTML = `
        <div>
          <strong>${s.time} - ${s.subject}</strong><br>
          <small>Raum ${s.room} (${s.day})</small>
        </div>
        <button style="margin-left:auto; border:none; background:none; color:red;">🗑️</button>
      `;

      item.querySelector('button').addEventListener('click', () => {
        schedule = schedule.filter(itemSched => itemSched.id !== s.id);
        saveAll();
        renderSchedule();
      });

      container.appendChild(item);
    });
  }

  const btnAddSchedule = document.getElementById('btn-add-schedule');
  if (btnAddSchedule) {
    btnAddSchedule.addEventListener('click', () => {
      const day = window.prompt('Wochentag (z.B. Mo):', 'Mo');
      const time = window.prompt('Uhrzeit (z.B. 08:00):', '08:00');
      const subject = window.prompt('Fach (z.B. Mathe):');
      const room = window.prompt('Raum (z.B. 204):', '204');

      if (day && time && subject) {
        schedule.push({ id: Date.now(), day, time, subject, room });
        saveAll();
        renderSchedule();
      }
    });
  }

  // Initialer Aufruf aller Renderelemente
  renderTasks();
  renderGrades();
  renderSchedule();
});

