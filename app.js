import {
	getFiles,
	addFile,
	updateFile,
	deleteFile,
	searchFiles,
	sortFiles,
} from "./fileSystem.js";

const fileListContainer = document.getElementById("fileList");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");
const addFileBtn = document.getElementById("addFileBtn");
const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const viewToggle = document.getElementById("viewToggle");
const darkModeToggle = document.getElementById("darkModeToggle");
const fileModal = document.getElementById("fileModal");
const modalFileName = document.getElementById("modalFileName");
const modalFileContent = document.getElementById("modalFileContent");
const modalFileTags = document.getElementById("modalFileTags");
const modalCancelBtn = document.getElementById("modalCancelBtn");
const modalSaveBtn = document.getElementById("modalSaveBtn");

let currentView = "grid";
let currentEditId = null;
let undoStack = [];
let redoStack = [];

function renderFiles(files = getFiles()) {
	fileListContainer.innerHTML = "";

	files.forEach((file) => {
		const fileCard = document.createElement("div");
		fileCard.className = `file-card bg-white dark:bg-gray-800 p-4 rounded shadow ${
			currentView === "list" ? "mb-4" : ""
		}`;
		fileCard.innerHTML = `
            <div class="file-icon text-4xl mb-2">
                ${getFileIcon(file.type)}
            </div>
            <div class="file-info">
                <h3 class="font-bold mb-2">${file.name}</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-2">${file.content.substring(
									0,
									50
								)}${file.content.length > 50 ? "..." : ""}</p>
                <p class="text-sm text-gray-500 dark:text-gray-500 mb-2">Updated: ${new Date(
									file.updatedAt
								).toLocaleString()}</p>
                <div class="tags mb-2">
                    ${file.tags
											.map(
												(tag) =>
													`<span class="inline-block bg-blue-200 dark:bg-blue-700 text-blue-800 dark:text-blue-200 rounded-full px-2 py-1 text-xs mr-1">${tag}</span>`
											)
											.join("")}
                </div>
            </div>
            <div class="file-actions flex justify-end">
                <button class="edit-file text-blue-500 hover:text-blue-600 mr-2" data-id="${
									file.id
								}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-file text-red-500 hover:text-red-600" data-id="${
									file.id
								}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
		fileListContainer.appendChild(fileCard);
	});
}

function getFileIcon(type) {
	switch (type) {
		case "text":
			return '<i class="fas fa-file-alt"></i>';
		case "image":
			return '<i class="fas fa-file-image"></i>';
		default:
			return '<i class="fas fa-file"></i>';
	}
}

function handleFileUpload(files) {
	Array.from(files).forEach((file) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const content = e.target.result;
			const type = file.type.startsWith("image/") ? "image" : "text";
			addFileToSystem(file.name, content, type);
		};
		reader.readAsDataURL(file);
	});
}

function addFileToSystem(name, content, type) {
	const newFile = addFile(name, content, type);
	undoStack.push({ action: "add", file: newFile });
	redoStack = [];
	renderFiles();
}

function updateFileInSystem(id, name, content, tags) {
	const oldFile = getFiles().find((f) => f.id === id);
	const updatedFile = updateFile(id, name, content, tags);
	undoStack.push({ action: "update", oldFile, newFile: updatedFile });
	redoStack = [];
	renderFiles();
}

function deleteFileFromSystem(id) {
	const deletedFile = getFiles().find((f) => f.id === id);
	deleteFile(id);
	undoStack.push({ action: "delete", file: deletedFile });
	redoStack = [];
	renderFiles();
}

function undo() {
	if (undoStack.length === 0) return;

	const action = undoStack.pop();
	if (action.action === "add") {
		deleteFile(action.file.id);
	} else if (action.action === "update") {
		updateFile(
			action.oldFile.id,
			action.oldFile.name,
			action.oldFile.content,
			action.oldFile.tags
		);
	} else if (action.action === "delete") {
		addFile(
			action.file.name,
			action.file.content,
			action.file.type,
			action.file.tags
		);
	}

	redoStack.push(action);
	renderFiles();
}

function redo() {
	if (redoStack.length === 0) return;

	const action = redoStack.pop();
	if (action.action === "add") {
		addFile(
			action.file.name,
			action.file.content,
			action.file.type,
			action.file.tags
		);
	} else if (action.action === "update") {
		updateFile(
			action.newFile.id,
			action.newFile.name,
			action.newFile.content,
			action.newFile.tags
		);
	} else if (action.action === "delete") {
		deleteFile(action.file.id);
	}

	undoStack.push(action);
	renderFiles();
}

searchInput.addEventListener("input", () => {
	const query = searchInput.value;
	const files = searchFiles(query);
	renderFiles(sortFiles(files, sortSelect.value));
});

sortSelect.addEventListener("change", () => {
	const files = searchFiles(searchInput.value);
	renderFiles(sortFiles(files, sortSelect.value));
});

addFileBtn.addEventListener("click", () => {
	showModal();
});

dropZone.addEventListener("dragover", (e) => {
	e.preventDefault();
	dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
	dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
	e.preventDefault();

	dropZone.classList.remove("drag-over");
	const files = e.dataTransfer.files;
	handleFileUpload(files);
});

fileInput.addEventListener("change", (e) => {
	const files = e.target.files;
	handleFileUpload(files);
});

viewToggle.addEventListener("click", () => {
	currentView = currentView === "grid" ? "list" : "grid";
	fileListContainer.classList.toggle("list-view");
	viewToggle.innerHTML =
		currentView === "grid"
			? '<i class="fas fa-th-list"></i>'
			: '<i class="fas fa-th"></i>';
});

darkModeToggle.addEventListener("click", () => {
	document.body.classList.toggle("dark");
	const isDarkMode = document.body.classList.contains("dark");
	darkModeToggle.innerHTML = isDarkMode
		? '<i class="fas fa-sun"></i>'
		: '<i class="fas fa-moon"></i>';
});

fileListContainer.addEventListener("click", (e) => {
	if (
		e.target.classList.contains("edit-file") ||
		e.target.parentElement.classList.contains("edit-file")
	) {
		const id = parseInt(e.target.closest(".edit-file").getAttribute("data-id"));
		const file = getFiles().find((f) => f.id === id);
		if (file) {
			showModal(file);
		}
	} else if (
		e.target.classList.contains("delete-file") ||
		e.target.parentElement.classList.contains("delete-file")
	) {
		const id = parseInt(
			e.target.closest(".delete-file").getAttribute("data-id")
		);
		deleteFileFromSystem(id);
	}
});

modalCancelBtn.addEventListener("click", hideModal);

modalSaveBtn.addEventListener("click", () => {
	const name = modalFileName.value.trim();
	const content = modalFileContent.value.trim();
	const tags = modalFileTags.value
		.split(",")
		.map((tag) => tag.trim())
		.filter((tag) => tag !== "");

	if (name && content) {
		if (currentEditId) {
			updateFileInSystem(currentEditId, name, content, tags);
		} else {
			addFileToSystem(name, content, "text", tags);
		}
		hideModal();
	}
});

function showModal(file = null) {
	if (file) {
		currentEditId = file.id;
		modalFileName.value = file.name;
		modalFileContent.value = file.content;
		modalFileTags.value = file.tags.join(", ");
	} else {
		currentEditId = null;
		modalFileName.value = "";
		modalFileContent.value = "";
		modalFileTags.value = "";
	}
	fileModal.classList.remove("hidden");
	fileModal.classList.add("flex");
}

function hideModal() {
	fileModal.classList.remove("flex");
	fileModal.classList.add("hidden");
}

document.addEventListener("keydown", (e) => {
	if (e.ctrlKey || e.metaKey) {
		if (e.key === "z") {
			e.preventDefault();
			undo();
		} else if (e.key === "y") {
			e.preventDefault();
			redo();
		}
	}
});

renderFiles();
