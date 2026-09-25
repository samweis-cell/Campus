document.addEventListener('DOMContentLoaded', () => {

  const APP_VERSION = 'v7.0';
  const versionElem = document.getElementById('app-version');
  if (versionElem) versionElem.innerText = APP_VERSION;

  const dateElem = document.getElementById('header-date');
  if (dateElem) {
    dateElem.innerText = new Date().toLocaleDateString('de-DE', { 
      weekday: 'short', day: 'numeric', month: 'short' 
    });
  }

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
  let exams = JSON.parse(localStorage.getItem('pwa_exams')) || [];
  let slotTimes = JSON.parse(localStorage.getItem('pwa_slot_times')) || {};

  function saveAll() {
    localStorage.setItem('pwa_tasks', JSON.stringify(tasks));
    localStorage.setItem('pwa_grades', JSON.stringify(grades));
    localStorage.setItem('pwa_schedule', JSON.stringify(schedule));
    localStorage.setItem('pwa_exams', JSON.stringify(exams));
    localStorage.setItem('pwa_slot_times', JSON.stringify(slotTimes));
    updateHeuteMode();
  }

  // Modals
  const backdrop = document.getElementById('modal-backdrop');

  window.closeModal = function() {
    backdrop.classList.remove('active');
    document.querySelectorAll('.modal-card').forEach(m => m.classList.remove('active'));
  };

  function openModal(modalId) {
    backdrop.classList.add('active');
    document.getElementById(modalId).classList.add('active');
  }

  document.getElementById('btn-open-schedule-modal').addEventListener('click', () => {
    fillModalSlotData();
    openModal('modal-schedule');
  });
  document.getElementById('btn-open-grade-modal').addEventListener('click', () => openModal('modal-grade'));
  document.getElementById('btn-open-task-modal').addEventListener('click', () => openModal('modal-task'));
  document.getElementById('btn-open-exam-modal').addEventListener('click', () => openModal('modal-exam'));

  // Umschalten Unterricht vs. Pause
  const typeSelect = document.getElementById('sched-type');
  const fieldsLesson = document.getElementById('fields-lesson');
  const fieldsPause = document.getElementById('fields-pause');

  typeSelect.addEventListener('change', () => {
    if (typeSelect.value === 'pause') {
      fieldsLesson.style.display = 'none';
      fieldsPause.style.display = 'block';
    } else {
      fieldsLesson.style.display = 'block';
      fieldsPause.style.display = 'none';
    }
  });

  // Automatisches Einfüllen der gemerkten Uhrzeit beim Slot-Wechsel
  const slotSelect = document.getElementById('sched-slot');
  const startHH = document.getElementById('sched-start-hh');
  const startMM = document.getElementById('sched-start-mm');
  const durationInput = document.getElementById('sched-duration');

  function fillModalSlotData() {
    const slot = slotSelect.value;
    if (slotTimes[slot]) {
      startHH.value = slotTimes[slot].hh || '';
      startMM.value = slotTimes[slot].mm || '';
      durationInput.value = slotTimes[slot].duration || '45';
    }
  }

  slotSelect.addEventListener('change', fillModalSlotData);

  // Hilfsfunktion: Endzeit berechnen
  function calcEndTime(hh, mm, durationMinutes) {
    let startMins = parseInt(hh) * 60 + parseInt(mm);
    let endMins = startMins + parseInt(durationMinutes);
    let endHH = Math.floor(endMins / 60) % 24;
    let endMM = endMins % 60;
    
    let formatHH = String(endHH).padStart(2, '0');
    let formatMM = String(endMM).padStart(2, '0');
    return `${formatHH}:${formatMM}`;
  }

  // HEUTE MODUS
  function updateHeuteMode() {
    const now = new Date();
    const daysMap = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const todayStr = daysMap[now.getDay()];
    const currentTimeStr = now.toTimeString().substring(0, 5);

    const todayLessons = schedule.filter(s => s.day === todayStr || s.type === 'pause')
                                 .sort((a,b) => (a.start || '').localeCompare(b.start || ''));

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
      if (currentLesson.type === 'pause') {
        currentElem.innerText = `☕ ${currentLesson.subject || 'Pause'}`;
        detailsElem.innerText = `Pause bis ${currentLesson.end} Uhr`;
      } else {
        currentElem.innerText = `🧮 ${currentLesson.subject}`;
        detailsElem.innerText = `Raum ${currentLesson.room || '-'} · ${currentLesson.teacher || '-'}`;
      }
      nextElem.innerText = nextLesson ? `Danach: ${nextLesson.subject}` : 'Danach: Schulschluss 🎉';
    } else if (nextLesson) {
      currentElem.innerText = '☕ Pause / Warten';
      detailsElem.innerText = `Nächste Stunde ab ${nextLesson.start} Uhr`;
      nextElem.innerText = `Danach: ${nextLesson.subject}`;
    } else {
      currentElem.innerText = '🏠 Feierabend';
      detailsElem.innerText = 'Der Unterricht für heute ist beendet';
      nextElem.innerText = '-';
    }
  }

  // STUNDENPLAN (Klassische Tabelle)
  function renderSchedule() {
    const tbody = document.getElementById('schedule-table-body');
    tbody.innerHTML = '';

    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
    const totalSlots = 10;

    for (let slot = 1; slot <= totalSlots; slot++) {
      const tr = document.createElement('tr');

      // Uhrzeit für diesen Slot ermitteln
      const st = slotTimes[slot];
      let timeInfo = 'Zeit ?';
      if (st && st.hh && st.mm && st.duration) {
        const hh = String(st.hh).padStart(2, '0');
        const mm = String(st.mm).padStart(2, '0');
        const startStr = `${hh}:${mm}`;
        const endStr = calcEndTime(hh, mm, st.duration);
        timeInfo = `${startStr} - ${endStr}`;
      }

      // Prüfen ob dieser Slot eine Pause für alle Tage ist
      const pauseEntry = schedule.find(s => parseInt(s.slot) === slot && s.type === 'pause');

      if (pauseEntry) {
        tr.className = 'pause-row';
        tr.innerHTML = `
          <td class="time-cell"><strong>Pause</strong><br><small>${timeInfo}</small></td>
          <td colspan="5" class="pause-cell">
            ☕ ${pauseEntry.subject || 'Pause'} (${pauseEntry.duration} Min)
            <button class="cell-delete" onclick="deleteSchedule(${pauseEntry.id})">🗑️</button>
          </td>
        `;
      } else {
        let rowHtml = `<td class="time-cell"><strong>${slot}. Std</strong><br><small>${timeInfo}</small></td>`;

        days.forEach(day => {
          const entry = schedule.find(s => parseInt(s.slot) === slot && s.day === day);

          if (entry) {
            rowHtml += `
              <td>
                <div class="cell-content">
                  <span class="cell-subject">${entry.subject}</span>
                  <span class="cell-info">R: ${entry.room || '-'}</span>
                  <span class="cell-info">${entry.teacher || '-'}</span>
                  <button class="cell-delete" onclick="deleteSchedule(${entry.id})">🗑️</button>
                </div>
              </td>
            `;
          } else {
            rowHtml += `<td>-</td>`;
          }
        });

        tr.innerHTML = rowHtml;
      }

      tbody.appendChild(tr);
    }
  }

  window.deleteSchedule = function(id) {
    schedule = schedule.filter(s => s.id !== id);
    saveAll();
    renderSchedule();
  };

  document.getElementById('form-schedule').addEventListener('submit', (e) => {
    e.preventDefault();

    const type = document.getElementById('sched-type').value;
    const slot = document.getElementById('sched-slot').value;
    const day = document.getElementById('sched-day').value;
    
    const hh = String(document.getElementById('sched-start-hh').value).padStart(2, '0');
    const mm = String(document.getElementById('sched-start-mm').value).padStart(2, '0');
    const duration = document.getElementById('sched-duration').value;

    const startStr = `${hh}:${mm}`;
    const endStr = calcEndTime(hh, mm, duration);

    // 1. Uhrzeiten für diesen Slot speichern (gilt für alle Tage!)
    slotTimes[slot] = { hh, mm, duration };

    // 2. Bestehenden Eintrag überschreiben
    if (type === 'pause') {
      // Pause gilt für den ganzen Slot
      schedule = schedule.filter(s => parseInt(s.slot) !== parseInt(slot));
      schedule.push({
        id: Date.now(),
        type: 'pause',
        slot,
        start: startStr,
        end: endStr,
        duration,
        subject: document.getElementById('sched-pause-name').value || 'Pause'
      });
    } else {
      // Normaler Unterricht für einen Wochentag
      schedule = schedule.filter(s => !(parseInt(s.slot) === parseInt(slot) && s.day === day));
      schedule.push({
        id: Date.now(),
        type: 'lesson',
        slot,
        day,
        start: startStr,
        end: endStr,
        duration,
        subject: document.getElementById('sched-subject').value,
        teacher: document.getElementById('sched-teacher').value,
        room: document.getElementById('sched-room').value
      });
    }

    saveAll();
    renderSchedule();
    closeModal();
    e.target.reset();
  });

  // ARBEITEN & Countdown
  function renderExams() {
    const container = document.getElementById('exam-list');
    container.innerHTML = '';

    if (exams.length === 0) {
      container.innerHTML = '<p style="color: gray;">Keine anstehenden Arbeiten eingetragen.</p>';
      return;
    }

    exams.sort((a,b) => a.date.localeCompare(b.date));

    const today = new Date().toISOString().split('T')[0];

    exams.forEach(ex => {
      const examDate = new Date(ex.date);
      const diffTime = examDate - new Date(today);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let badgeText = diffDays === 0 ? 'Heute!' : (diffDays > 0 ? `In ${diffDays} Tag(en)` : 'Vorbei');

      const item = document.createElement('div');
      item.className = 'task-item';
      item.innerHTML = `
        <div>
          <strong>${ex.subject}</strong> <span class="days-tag">${badgeText}</span><br>
          <small>Datum: ${new Date(ex.date).toLocaleDateString('de-DE')} | ${ex.topic || 'Kein Thema angegeben'}</small>
        </div>
        <button style="margin-left:auto; border:none; background:none; color:red;">🗑️</button>
      `;

      item.querySelector('button').addEventListener('click', () => {
        exams = exams.filter(i => i.id !== ex.id);
        saveAll();
        renderExams();
      });

      container.appendChild(item);
    });
  }

  document.getElementById('form-exam').addEventListener('submit', (e) => {
    e.preventDefault();
    exams.push({
      id: Date.now(),
      subject: document.getElementById('exam-subject').value,
      date: document.getElementById('exam-date').value,
      topic: document.getElementById('exam-topic').value
    });
    saveAll();
    renderExams();
    closeModal();
    e.target.reset();
  });

  // NOTEN & SIMULATOR
  function renderGrades() {
    const container = document.getElementById('grades-list');
    const avgElement = document.getElementById('grade-average');
    container.innerHTML = '';

    if (grades.length === 0) {
      container.innerHTML = '<p style="color: gray;">Noch keine Noten eingetragen.</p>';
      avgElement.innerText = '-';
      return;
    }

    let totalPoints = 0;
    let totalWeight = 0;

    grades.forEach(g => {
      const p = gradePoints[g.value] || 2.0;
      const w = parseFloat(g.weight || 0.5);
      totalPoints += p * w;
      totalWeight += w;
    });

    const avg = (totalPoints / totalWeight).toFixed(2);
    avgElement.innerText = avg;

    grades.forEach(g => {
      const item = document.createElement('div');
      item.className = 'task-item';
      item.innerHTML = `
        <div>
          <strong>${g.subject}:</strong> Note ${g.value}
          <br><small>Gewichtung: ${g.weight * 100}%</small>
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

  document.getElementById('btn-calc-sim').addEventListener('click', () => {
    const targetAvg = parseFloat(document.getElementById('sim-target').value);
    const resultElem = document.getElementById('sim-result');

    if (!targetAvg || grades.length === 0) {
      resultElem.innerText = 'Trage erst Noten und einen Wunschschnitt ein!';
      return;
    }

    let totalPoints = 0;
    let totalWeight = 0;

    grades.forEach(g => {
      const p = gradePoints[g.value] || 2.0;
      const w = parseFloat(g.weight || 0.5);
      totalPoints += p * w;
      totalWeight += w;
    });

    const nextWeight = 0.5;
    const requiredGrade = ((targetAvg * (totalWeight + nextWeight)) - totalPoints) / nextWeight;

    if (requiredGrade < 1.0) {
      resultElem.innerText = `Super! Du kannst sogar eine 1.0 schreiben und erreichst dein Ziel.`;
    } else if (requiredGrade > 6.0) {
      resultElem.innerText = `Das Ziel ist rechnerisch leider nicht mehr möglich.`;
    } else {
      resultElem.innerText = `Du brauchst mindestens eine ${requiredGrade.toFixed(1)} in der nächsten Arbeit.`;
    }
  });

  document.getElementById('form-grade').addEventListener('submit', (e) => {
    e.preventDefault();
    grades.push({
      id: Date.now(),
      subject: document.getElementById('grade-subject').value,
      value: document.getElementById('grade-value').value,
      weight: document.getElementById('grade-weight').value
    });
    saveAll();
    renderGrades();
    closeModal();
    e.target.reset();
  });

  // AUFGABEN
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

  // Initialisierung
  renderTasks();
  renderGrades();
  renderSchedule();
  renderExams();
  updateHeuteMode();
});


