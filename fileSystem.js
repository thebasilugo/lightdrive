const STORAGE_KEY = "lightDriveFiles";

export function getFiles() {
	return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

export function saveFiles(files) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
}

export function addFile(name, content, type = "text", tags = []) {
	const files = getFiles();
	const newFile = {
		id: Date.now(),
		name,
		content,
		type,
		tags,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};
	files.push(newFile);
	saveFiles(files);
	return newFile;
}

export function updateFile(id, name, content, tags) {
	const files = getFiles();
	const index = files.findIndex((file) => file.id === id);
	if (index !== -1) {
		files[index] = {
			...files[index],
			name,
			content,
			tags,
			updatedAt: new Date().toISOString(),
		};
		saveFiles(files);
		return files[index];
	}
	return null;
}

export function deleteFile(id) {
	const files = getFiles();
	const newFiles = files.filter((file) => file.id !== id);
	saveFiles(newFiles);
}

export function searchFiles(query) {
	const files = getFiles();
	return files.filter(
		(file) =>
			file.name.toLowerCase().includes(query.toLowerCase()) ||
			file.content.toLowerCase().includes(query.toLowerCase()) ||
			file.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
	);
}

export function sortFiles(files, criterion) {
	return [...files].sort((a, b) => {
		if (criterion === "name") {
			return a.name.localeCompare(b.name);
		} else if (criterion === "date") {
			return new Date(b.updatedAt) - new Date(a.updatedAt);
		}
	});
}
