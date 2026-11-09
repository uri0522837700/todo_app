(() => {
  const $ = (selector) => document.querySelector(selector);
  const STORAGE_KEY = 'daily-task-list-v1';
  let tasks = [];
  let currentFilter = 'all';

  try { tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch { tasks = []; }

  const today = new Date();
  $('#todayLabel').textContent = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
  }).format(today);

  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, char => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  })[char]);
  const formatDate = (value) => {
    if (!value) return '';
    const [y,m,d] = value.split('-');
    return `${y}.${m}.${d}`;
  };

  function render() {
    const total = tasks.length;
    const done = tasks.filter(task => task.done).length;
    const left = total - done;
    const percent = total ? Math.round(done / total * 100) : 0;
    $('#totalCount').textContent = total;
    $('#doneCount').textContent = done;
    $('#leftCount').textContent = left;
    $('#progressLabel').textContent = `${percent}% 완료`;
    $('#progressFill').style.width = `${percent}%`;
    $('#remainingText').textContent = `남은 할 일 ${left}개`;

    const search = $('#searchInput').value.trim().toLowerCase();
    const visible = tasks.filter(task => {
      const matchesFilter = currentFilter === 'all' ||
        (currentFilter === 'active' && !task.done) ||
        (currentFilter === 'done' && task.done);
      return matchesFilter && task.title.toLowerCase().includes(search);
    });

    $('#taskList').innerHTML = visible.map(task => `
      <li class="task-item ${task.done ? 'completed' : ''}" data-id="${task.id}">
        <input class="task-check" type="checkbox" aria-label="완료 표시" ${task.done ? 'checked' : ''}>
        <div class="task-main">
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-meta">
            <span class="priority ${task.priority}">${{high:'높음',normal:'보통',low:'낮음'}[task.priority]}</span>
            ${task.date ? `<span>마감 ${formatDate(task.date)}</span>` : ''}
          </div>
        </div>
        <div class="task-actions">
          <button class="icon-btn edit-btn" type="button" aria-label="수정" title="수정">✎</button>
          <button class="icon-btn delete-btn" type="button" aria-label="삭제" title="삭제">×</button>
        </div>
      </li>`).join('');

    const showEmpty = visible.length === 0;
    $('#emptyState').style.display = showEmpty ? 'block' : 'none';
    $('#emptyState strong').textContent = total === 0 ? '아직 등록된 할 일이 없어요.' :
      (search ? '검색 결과가 없어요.' : '이 목록은 비어 있어요.');
    $('#emptyState span').textContent = total === 0 ?
      '위 입력창에 오늘 할 일을 적어보세요!' : '다른 필터를 선택하거나 새로운 할 일을 추가해 보세요.';
    $('#clearDoneBtn').disabled = done === 0;
    $('#clearDoneBtn').style.opacity = done === 0 ? '.45' : '1';
  }

  $('#taskForm').addEventListener('submit', event => {
    event.preventDefault();
    const title = $('#taskInput').value.trim();
    if (!title) return;
    tasks.unshift({
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random())),
      title, date: $('#dateInput').value,
      priority: $('#priorityInput').value, done: false
    });
    save(); $('#taskForm').reset(); $('#taskInput').focus(); render();
  });

  $('#taskList').addEventListener('change', event => {
    if (!event.target.matches('.task-check')) return;
    const item = event.target.closest('.task-item');
    const task = tasks.find(entry => entry.id === item.dataset.id);
    if (task) { task.done = event.target.checked; save(); render(); }
  });

  $('#taskList').addEventListener('click', event => {
    const item = event.target.closest('.task-item');
    if (!item) return;
    const index = tasks.findIndex(entry => entry.id === item.dataset.id);
    if (index < 0) return;
    if (event.target.closest('.delete-btn')) {
      tasks.splice(index, 1); save(); render();
    } else if (event.target.closest('.edit-btn')) {
      const updated = prompt('할 일 내용을 수정해 주세요.', tasks[index].title);
      if (updated === null) return;
      if (!updated.trim()) { alert('할 일 내용을 입력해 주세요.'); return; }
      tasks[index].title = updated.trim(); save(); render();
    }
  });

  document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
      currentFilter = button.dataset.filter;
      document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn === button));
      render();
    });
  });
  $('#searchInput').addEventListener('input', render);
  $('#clearDoneBtn').addEventListener('click', () => {
    if (!tasks.some(task => task.done)) return;
    if (confirm('완료한 할 일을 모두 삭제할까요?')) {
      tasks = tasks.filter(task => !task.done); save(); render();
    }
  });

  render();
})();
