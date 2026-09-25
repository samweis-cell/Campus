document.addEventListener('DOMContentLoaded', () => {

  // Versions-Anzeige für die Entwicklung
  const APP_VERSION = 'v4.0';
  const versionElem = document.getElementById('app-version');
  if (versionElem) {
    versionElem.innerText = APP_VERSION;
  }

  // Datum oben anzeigen
  const dateElem = document.getElementById('header-date');
  if (dateElem) {
    dateElem.innerText = new Date().toLocaleDateString('de-DE', { 
      weekday: 'short', day: 'numeric', month: 'short' 
    });
  }

  // Noten-Mapping für den exakten Schnitt
  const gradePoints = {
    '1+': 1.0, '1': 1.0, '1-': 1.3,
    '2+': 1.7, '2': 2.0, '2-': 2.3,
    '3+': 2.7, '3': 3.0, '3-': 3.3,
    '4+': 3.7, '4': 4.0, '4-': 4.3,
    '5+': 4.7, '5': 5.0, '5-': 5.3,
    '6': 6.0
  };

  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      
      document.getElementById(`tab-${tabId}`).classList.add('active');
      btn.classList.add('active');
      
      const titles = { heute: 'Heute', stundenplan: 'Stundenplan', aufgaben: 'Aufgaben', arbeiten: 'Arbeiten', noten: 'Noten' };
      document.getElementById('header-title').innerText = titles[tabId] || 'Schul-Planer';
    });
  });

  // Speicher
  let tasks = JSON.parse(localStorage.getItem('pwa_tasks')) || [];
  let grades = JSON.parse(localStorage.getItem('pwa_grades')) || [];
  let schedule = JSON.parse(localStorage.getItem('pwa_schedule')) || [];

  function saveAll() {
    localStorage.setItem('pwa_tasks', JSON.stringify(tasks));
    localStorage.setItem('pwa_grades', JSON.stringify(grades));
    localStorage.setItem('pwa_schedule', JSON.stringify(schedule));
    updateHeuteMode();
  }

  // --- MODAL MANAGEMENT ---
  const backdrop = document.getElementById('modal-backdrop');

  window.closeModal = function() {
    backdrop.classList.remove('active');
    document.querySelectorAll('.modal-card').forEach(m => m.classList.remove('active'));
  };

  function openModal(modalId) {
    backdrop.classList.add('active');
    document.getElementById(modalId).classList.add('active');
  }

  document.getElementById('btn-open-schedule-modal').addEventListener('click', () => openModal('modal-schedule'));
  document.getElementById('btn-open-grade-modal').addEventListener('click', () => openModal('modal-grade'));
  document.getElementById('btn-open-task-modal').addEventListener('click', () => openModal('modal-task'));

  // --- HEUTE MODUS ---
  function updateHeuteMode() {
    const now = new Date();
    const daysMap = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const todayStr = daysMap[now.getDay()];
    const currentTimeStr = now.toTimeString().substring(0, 5); // "HH:MM"

    const todayLessons = schedule.filter(s => s.day === todayStr)
                                 .sort((a,b) => a.start.localeCompare(b.start));

    const currentElem = document.getElementById('current-subject');
    const detailsElem = document.getElementById('current-details');
    const nextElem = document.getElementById('next-subject');

    if (todayLessons.length === 0) {
      currentElem.innerText = 'Frei 🎉';
      detailsElem.innerText = 'Keine Stunden für heute eingetragen';
      nextElem.innerText = '-';
      return;
    }

    let currentLesson = null;
    let nextLesson = null;

    for (let i = 0; i < todayLessons.length; i++) {
      const lesson = todayLessons[i];
      if (currentTimeStr >= lesson.start && currentTimeStr <= lesson.end) {
        currentLesson = lesson;
        nextLesson = todayLessons[i + 1] || null;
        break;
      } else if (currentTimeStr < lesson.start) {
        nextLesson = lesson;
        break;
      }
    }

    if (currentLesson) {
      currentElem.innerText = `🧮 ${currentLesson.subject}`;
      detailsElem.innerText = `Raum ${currentLesson.room || '-'} · Fr/Hr ${currentLesson.teacher || '-'}`;
      nextElem.innerText = nextLesson ? `Danach: ${nextLesson.subject} (${nextLesson.room || '-'})` : 'Danach: Schulschluss 🎉';
    } else if (nextLesson) {
      currentElem.innerText = '☕ Pause / Warten';
      detailsElem.innerText = `Nächste Stunde ab ${nextLesson.start} Uhr`;
      nextElem.innerText = `Danach: ${nextLesson.subject} (${nextLesson.room || '-'})`;
    } else {
      currentElem.innerText = '🏠 Feierabend';
      detailsElem.innerText = 'Der Unterricht für heute ist beendet';
      nextElem.innerText = '-';
    }
  }

  // --- STUNDENPLAN ---
  function renderSchedule() {
    const container = document.getElementById('schedule-list');
    container.innerHTML = '';

    if (schedule.length === 0) {
      container.innerHTML = '<p style="color: gray;">Keine Stunden eingetragen.</p>';
      return;
    }

    schedule.sort((a,b) => a.start.localeCompare(b.start));

    schedule.forEach(s => {
      const item = document.createElement('div');
      item.className = 'task-item';
      item.innerHTML = `
        <div>
          <strong>[${s.day}] ${s.start} - ${s.end} Uhr: ${s.subject}</strong><br>
          <small>Raum: ${s.room || '-'} | Lehrer: ${s.teacher || '-'}</small>
        </div>
        <button style="margin-left:auto; border:none; background:none; color:red;">🗑️</button>
      `;

      item.querySelector('button').addEventListener('click', () => {
        schedule = schedule.filter(i => i.id !== s.id);
        saveAll();
        renderSchedule();
      });

      container.appendChild(item);
    });
  }

  document.getElementById('form-schedule').addEventListener('submit', (e) => {
    e.preventDefault();
    schedule.push({
      id: Date.now(),
      day: document.getElementById('sched-day').value,
      subject: document.getElementById('sched-subject').value,
      teacher: document.getElementById('sched-teacher').value,
      room: document.getElementById('sched-room').value,
      start: document.getElementById('sched-start').value,
      end: document.getElementById('sched-end').value
    });
    saveAll();
    renderSchedule();
    closeModal();
    e.target.reset();
  });

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
    grades.forEach(g => {
      totalSum += gradePoints[g.value] || 2.0;
    });

    avgElement.innerText = (totalSum / grades.length).toFixed(2);

    grades.forEach(g => {
      const item = document.createElement('div');
      item.className = 'task-item';
      item.innerHTML = `
        <div>
          <strong>${g.subject}:</strong> Note ${g.value}
          <br><small>${g.type}</small>
        </div>
        <button style="margin-left:auto; border:none; background:none; color:red;">🗑️</button>
      `;

      item.querySelector('button').addEventListener('click', () => {
        grades = grades.filter(i => i.id !== g.id);
        saveAll();
        renderGrades();
      });

      container.appendChild(item);
    });
  }

  document.getElementById('form-grade').addEventListener('submit', (e) => {
    e.preventDefault();
    grades.push({
      id: Date.now(),
      subject: document.getElementById('grade-subject').value,
      value: document.getElementById('grade-value').value,
      type: document.getElementById('grade-type').value
    });
    saveAll();
    renderGrades();
    closeModal();
    e.target.reset();
  });

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
        <input type="checkbox" ${task.done ? 'checked' : ''}>
        <span style="${task.done ? 'text-decoration: line-through; color: gray;' : ''}">${task.title}</span>
        <button style="margin-left:auto; border:none; background:none; color:red;">🗑️</button>
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

      allContainer.appendChild(item);
      if (!task.done) heuteContainer.appendChild(item.cloneNode(true));
    });
  }

  document.getElementById('form-task').addEventListener('submit', (e) => {
    e.preventDefault();
    tasks.push({
      id: Date.now(),
      title: document.getElementById('task-title').value,
      done: false
    });
    saveAll();
    renderTasks();
    closeModal();
    e.target.reset();
  });

  // Initial laden
  renderTasks();
  renderGrades();
  renderSchedule();
  updateHeuteMode();
});
