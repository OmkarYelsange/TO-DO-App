document.addEventListener("DOMContentLoaded", function () {
  // DOM Elements
  const taskForm = document.getElementById("taskForm");
  const taskInput = document.getElementById("taskInput");
  const taskList = document.getElementById("taskList");
  const clearCompletedBtn = document.getElementById("clearCompleted");
  const tasksRemaining = document.getElementById("tasksRemaining");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const themeToggle = document.getElementById("themeToggle");
  const progressBar = document.getElementById("progressBar");
  const body = document.body;
  const confettiContainer = document.getElementById("confettiContainer");

  // State
  let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  let currentFilter = "all";

  // Initialize the app
  function init() {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      body.classList.add("dark-mode");
    }

    renderTasks();
    updateTaskCount();
    setupEventListeners();
  }

  // Set up event listeners
  function setupEventListeners() {
    taskForm.addEventListener("submit", addTask);
    clearCompletedBtn.addEventListener("click", clearCompletedTasks);
    themeToggle.addEventListener("click", toggleTheme);

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        filterButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");
        currentFilter = button.dataset.filter;
        renderTasks();
      });
    });
  }

  // Add a new task
  function addTask(e) {
    e.preventDefault();

    const taskText = taskInput.value.trim();
    if (taskText === "") return;

    const newTask = {
      id: Date.now(),
      text: taskText,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateTaskCount();

    // Clear input and focus
    taskInput.value = "";
    taskInput.focus();

    // Add slight animation to the form
    taskForm.style.transform = "translateY(2px)";
    setTimeout(() => {
      taskForm.style.transform = "translateY(0)";
    }, 100);
  }

  // Render tasks based on current filter
  function renderTasks() {
    taskList.innerHTML = "";

    let filteredTasks = tasks;
    if (currentFilter === "active") {
      filteredTasks = tasks.filter((task) => !task.completed);
    } else if (currentFilter === "completed") {
      filteredTasks = tasks.filter((task) => task.completed);
    }

    if (filteredTasks.length === 0) {
      taskList.innerHTML =
        '<p class="empty-message">No tasks found. Add your first mission!</p>';
      return;
    }

    filteredTasks.forEach((task) => {
      const taskItem = document.createElement("li");
      taskItem.className = `task-item ${task.completed ? "completed" : ""}`;
      taskItem.dataset.id = task.id;

      taskItem.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${
                  task.completed ? "checked" : ""
                }>
                <span class="task-text">${task.text}</span>
                <div class="task-actions">
                    <button class="task-btn edit-btn" title="Edit task">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="task-btn delete-btn" title="Delete task">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;

      taskList.appendChild(taskItem);

      // Add event listeners to the new task
      const checkbox = taskItem.querySelector(".task-checkbox");
      const editBtn = taskItem.querySelector(".edit-btn");
      const deleteBtn = taskItem.querySelector(".delete-btn");
      const taskText = taskItem.querySelector(".task-text");

      checkbox.addEventListener("change", () => toggleTaskComplete(task.id));
      deleteBtn.addEventListener("click", () => deleteTask(task.id));
      editBtn.addEventListener("click", () =>
        enableEditMode(taskItem, task.id, taskText)
      );
    });
  }

  // Toggle task completion status
  function toggleTaskComplete(taskId) {
    const taskIndex = tasks.findIndex((task) => task.id === taskId);
    const wasCompleted = tasks[taskIndex].completed;

    tasks[taskIndex].completed = !wasCompleted;
    saveTasks();
    updateTaskCount();

    // If completing a task, show celebration if all tasks are now done
    if (
      !wasCompleted &&
      tasks.every((task) => task.completed) &&
      tasks.length > 0
    ) {
      celebrateCompletion();
    }

    // Re-render if we're filtering by active/completed
    if (currentFilter !== "all") {
      renderTasks();
    }
  }

  // Delete a task
  function deleteTask(taskId) {
    tasks = tasks.filter((task) => task.id !== taskId);
    saveTasks();
    renderTasks();
    updateTaskCount();
  }

  // Enable edit mode for a task
  function enableEditMode(taskItem, taskId, taskTextElement) {
    // If already in edit mode, ignore
    if (taskItem.classList.contains("editing")) return;

    taskItem.classList.add("editing");
    const currentText = taskTextElement.textContent;

    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "task-edit-input";
    editInput.value = currentText;

    taskTextElement.replaceWith(editInput);
    editInput.focus();

    function saveEdit() {
      const newText = editInput.value.trim();
      if (newText && newText !== currentText) {
        tasks = tasks.map((task) => {
          if (task.id === taskId) {
            return { ...task, text: newText };
          }
          return task;
        });
        saveTasks();
      }

      editInput.removeEventListener("blur", saveEdit);
      editInput.removeEventListener("keyup", handleKeyUp);

      taskTextElement.textContent = newText || currentText;
      editInput.replaceWith(taskTextElement);
      taskItem.classList.remove("editing");
    }

    function handleKeyUp(e) {
      if (e.key === "Enter") {
        saveEdit();
      } else if (e.key === "Escape") {
        editInput.replaceWith(taskTextElement);
        taskItem.classList.remove("editing");
        editInput.removeEventListener("blur", saveEdit);
        editInput.removeEventListener("keyup", handleKeyUp);
      }
    }

    editInput.addEventListener("blur", saveEdit);
    editInput.addEventListener("keyup", handleKeyUp);
  }

  // Clear all completed tasks
  function clearCompletedTasks() {
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    renderTasks();
    updateTaskCount();
  }

  // Update the task counter and progress bar
  function updateTaskCount() {
    const totalTasks = tasks.length;
    const activeTasks = tasks.filter((task) => !task.completed).length;
    const completedTasks = totalTasks - activeTasks;

    // Update counter text
    tasksRemaining.textContent = `${activeTasks} ${
      activeTasks === 1 ? "mission" : "missions"
    } awaiting`;

    // Update progress bar
    if (totalTasks > 0) {
      const progressPercentage = (completedTasks / totalTasks) * 100;
      progressBar.style.width = `${progressPercentage}%`;
    } else {
      progressBar.style.width = "0%";
    }
  }

  // Toggle between dark and light theme
  function toggleTheme() {
    body.classList.toggle("dark-mode");

    // Save theme preference
    const isDarkMode = body.classList.contains("dark-mode");
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }

  // Celebrate when all tasks are completed
  function celebrateCompletion() {
    // Create confetti
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        const confetti = document.createElement("div");
        confetti.className = "confetti";

        // Random properties
        const size = Math.random() * 10 + 5;
        const color = `hsl(${Math.random() * 360}, 100%, 50%)`;
        const left = Math.random() * 100;
        const animationDuration = Math.random() * 3 + 2;

        confetti.style.width = `${size}px`;
        confetti.style.height = `${size}px`;
        confetti.style.backgroundColor = color;
        confetti.style.left = `${left}%`;
        confetti.style.animationDuration = `${animationDuration}s`;

        confettiContainer.appendChild(confetti);

        // Remove confetti after animation
        setTimeout(() => {
          confetti.remove();
        }, animationDuration * 1000);
      }, i * 100);
    }
  }

  // Save tasks to localStorage
  function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
  }

  // Initialize the app
  init();
});
