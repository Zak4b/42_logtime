// Calcule uniquement le total en secondes (optionnellement en prenant "now" pour les sessions en cours)
export function calculateTotalSeconds(locations, now = new Date()) {
	let totalSeconds = 0;
	// Défensive: trier par begin_at croissant
	locations.sort((a, b) => new Date(a.begin_at) - new Date(b.begin_at));

	for (const loc of locations) {
		const start = new Date(loc.begin_at);
		const end = loc.end_at ? new Date(loc.end_at) : now;
		totalSeconds += (end - start) / 1000;
	}

	return totalSeconds;
}

export function formatDuration(seconds) {
	const s = Math.floor(seconds);
	const h = String(Math.floor(s / 3600)).padStart(2, "0");
	const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
	const sec = String(s % 60).padStart(2, "0");
	return `${h}h ${m}m ${sec}s`;
}

export function formatTime(date, includeSeconds = false) {
	const dateObj = date instanceof Date ? date : new Date(date);

	const options = {
		hour: "2-digit",
		minute: "2-digit",
	};

	if (includeSeconds) {
		options.second = "2-digit";
	}

	return dateObj.toLocaleTimeString([], options);
}
