
const TASKS_KEY = "studentbuddy_tasks";
const EXAMS_KEY = "studentbuddy_exams";

// Load saved data, or start with empty lists.
function loadData(key) {
  try {
    const saved = localStorage.getItem(key);
    const data = saved ? JSON.parse(saved) : [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Could not load saved data:", error);
    return [];
  }
}

let tasks = loadData(TASKS_KEY);
let exams = loadData(EXAMS_KEY);

// Save data automatically in this browser.
function saveTasks() {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    alert("Could not save tasks. Browser storage may be unavailable.");
    console.error(error);
  }
}

function saveExams() {
  try {
    localStorage.setItem(EXAMS_KEY, JSON.stringify(exams));
  } catch (error) {
    alert("Could not save exams. Browser storage may be unavailable.");
    console.error(error);
  }
}

// Turn user-entered text into safe HTML text.
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

// Format date-only strings without timezone shifting.
function formatDate(dateString) {
  if (!dateString) return "No due date";

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Display today's date at the top.
document.getElementById("todayDate").textContent =
  new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });

// Add a task when the task form is submitted.
document.getElementById("taskForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const title = document.getElementById("taskTitle").value.trim();
  const category = document.getElementById("taskCategory").value;
  const deadline = document.getElementById("taskDeadline").value;

  if (!title) return;

  tasks.push({
    id: createId(),
    title,
    category,
    deadline,
    completed: false
  });

  saveTasks();
  this.reset();
  renderAll();
});

// Add an exam when the exam form is submitted.
document.getElementById("examForm").addEventListener("submit", function(event) {
  event.preventDefault();

  const subject = document.getElementById("examSubject").value.trim();
  const date = document.getElementById("examDate").value;

  if (!subject || !date) return;

  exams.push({
    id: createId(),
    subject,
    date
  });

  saveExams();
  this.reset();
  renderAll();
});

// Update a task's completed status or delete it.
document.getElementById("taskList").addEventListener("click", function(event) {
  const button = event.target.closest("[data-delete-task]");
  if (button) {
    const id = button.dataset.deleteTask;
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderAll();
  }
});

document.getElementById("taskList").addEventListener("change", function(event) {
  const checkbox = event.target.closest("[data-complete-task]");
  if (!checkbox) return;

  const task = tasks.find(item => item.id === checkbox.dataset.completeTask);
  if (!task) return;

  task.completed = checkbox.checked;
  saveTasks();
  renderAll();
});

// Delete an exam.
document.getElementById("examList").addEventListener("click", function(event) {
  const button = event.target.closest("[data-delete-exam]");
  if (!button) return;

  exams = exams.filter(exam => exam.id !== button.dataset.deleteExam);
  saveExams();
  renderAll();
});

// Display all tasks.
function renderTasks() {
  const list = document.getElementById("taskList");

  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.deadline) return b.deadline ? 1 : 0;
    if (!b.deadline) return -1;
    return a.deadline.localeCompare(b.deadline);
  });

  if (sortedTasks.length === 0) {
    list.innerHTML = '<div class="empty-state">No tasks yet. Add your first task above! ✨</div>';
  } else {
    list.innerHTML = sortedTasks.map(task => {
      const isOverdue =
        task.deadline && task.deadline < todayString() && !task.completed;

      return `
        <article class="item-card ${task.completed ? "completed" : ""}">
          <div class="item-main">
            <input
              type="checkbox"
              data-complete-task="${escapeHTML(task.id)}"
              ${task.completed ? "checked" : ""}
              aria-label="Mark ${escapeHTML(task.title)} as completed"
            >
            <div class="item-content">
              <p class="item-title">${escapeHTML(task.title)}</p>
              <span class="item-meta">${escapeHTML(task.category)}</span>
              <span class="item-meta ${isOverdue ? "overdue" : ""}">
                ${isOverdue ? "Overdue: " : "Due: "}${escapeHTML(formatDate(task.deadline))}
              </span>
              ${task.completed ? '<span class="status">Completed</span>' : ""}
            </div>
          </div>
          <button
            class="delete-button"
            data-delete-task="${escapeHTML(task.id)}"
            type="button"
          >Delete</button>
        </article>
      `;
    }).join("");
  }

  document.getElementById("taskCountLabel").textContent =
    `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`;
}

// Update the progress dashboard.
function renderProgress() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const pending = total - completed;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById("totalTasks").textContent = total;
  document.getElementById("pendingTasks").textContent = pending;
  document.getElementById("completedTasks").textContent = completed;
  document.getElementById("progressText").textContent = `${percentage}% completed`;
  document.getElementById("progressFill").style.width = `${percentage}%`;
}

// Display exams, with the nearest exam first.
function renderExams() {
  const list = document.getElementById("examList");

  const sortedExams = [...exams].sort((a, b) => a.date.localeCompare(b.date));

  if (sortedExams.length === 0) {
    list.innerHTML = '<div class="empty-state">No exams added yet. Plan your next exam! 📝</div>';
  } else {
    list.innerHTML = sortedExams.map(exam => `
      <article class="item-card">
        <div class="item-main">
          <span>📝</span>
          <div class="item-content">
            <p class="item-title">${escapeHTML(exam.subject)}</p>
            <span class="item-meta">Exam date: ${escapeHTML(formatDate(exam.date))}</span>
          </div>
        </div>
        <button
          class="delete-button"
          data-delete-exam="${escapeHTML(exam.id)}"
          type="button"
        >Delete</button>
      </article>
    `).join("");
  }

  document.getElementById("examCountLabel").textContent =
    `${exams.length} ${exams.length === 1 ? "exam" : "exams"}`;
}

// Show future and overdue task deadlines.
function renderDeadlines() {
  const list = document.getElementById("deadlineList");
  const today = todayString();

  const upcoming = tasks
    .filter(task => task.deadline && !task.completed)
    .sort((a, b) => a.deadline.localeCompare(b.deadline));

  if (upcoming.length === 0) {
    list.innerHTML = '<div class="empty-state">You have no pending deadlines. Great work! 🎉</div>';
    return;
  }

  list.innerHTML = upcoming.map(task => {
    const isOverdue = task.deadline < today;

    return `
      <article class="item-card">
        <div class="item-content">
          <p class="item-title">${escapeHTML(task.title)}</p>
          <span class="item-meta">${escapeHTML(task.category)}</span>
        </div>
        <span class="item-meta ${isOverdue ? "overdue" : ""}">
          ${isOverdue ? "Overdue" : "Due"}: ${escapeHTML(formatDate(task.deadline))}
        </span>
      </article>
    `;
  }).join("");
}

// Refresh every part of the app.
function renderAll() {
  renderTasks();
  renderProgress();
  renderExams();
  renderDeadlines();
}

// Display saved tasks and exams when the page opens.
renderAll();
