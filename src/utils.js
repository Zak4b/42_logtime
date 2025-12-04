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

/**
 * Calcule le temps total de pause dans la journée
 * @param {Array} sortedSessions - Toutes les sessions triées par begin_at
 * @returns {number} - Temps total de pause en secondes
 */
export function calculateTotalPauseTime(sortedSessions) {
	let totalPauseSeconds = 0;

	for (let i = 0; i < sortedSessions.length - 1; i++) {
		const currentSession = sortedSessions[i];
		const nextSession = sortedSessions[i + 1];

		if (currentSession.end_at) {
			const currentEnd = new Date(currentSession.end_at);
			const nextBegin = new Date(nextSession.begin_at);
			const pauseSeconds = (nextBegin - currentEnd) / 1000;

			if (pauseSeconds > 0) {
				totalPauseSeconds += pauseSeconds;
			}
		}
	}

	// Ajouter la pause en cours si la dernière session est terminée
	const lastSession = sortedSessions[sortedSessions.length - 1];
	if (lastSession && lastSession.end_at) {
		const currentEnd = new Date(lastSession.end_at);
		const now = new Date();
		const pauseSeconds = (now - currentEnd) / 1000;
		if (pauseSeconds > 0) {
			totalPauseSeconds += pauseSeconds;
		}
	}

	return totalPauseSeconds;
}

/**
 * Calcule les informations de pause après une session
 * @param {number} index - L'index de la session dans le tableau trié
 * @param {Array} sortedSessions - Toutes les sessions triées par begin_at
 * @param {number} totalSeconds - Le total de logtime en secondes
 * @returns {Object|null} - Objet avec {seconds, formatted, label, isOngoing, totalDailyPause} ou null si pas de pause à afficher
 */
export function getPauseInfo(index, sortedSessions, totalSeconds) {
	const session = sortedSessions[index];
	if (!session) {
		return null;
	}

	// La session doit être terminée pour avoir une pause
	if (!session.end_at) {
		return null;
	}

	const currentEnd = new Date(session.end_at);
	const nextBegin = sortedSessions[index + 1] ? new Date(sortedSessions[index + 1].begin_at) : new Date();
	const pauseSeconds = (nextBegin - currentEnd) / 1000;

	if (index === sortedSessions.length - 1) {
		if (totalSeconds >= 7 * 3600) {
			return null; // Ne pas afficher si logtime >= 7h
		}
	}

	if (pauseSeconds <= 0) {
		return null;
	}

	const isOngoing = index === sortedSessions.length - 1;
	const label = isOngoing ? "Pause en cours" : "Pause";
	
	// Calculer le temps total de pause de la journée
	const totalDailyPause = calculateTotalPauseTime(sortedSessions);

	return {
		seconds: pauseSeconds,
		formatted: formatDuration(pauseSeconds),
		label,
		isOngoing,
		totalDailyPause, // Ajout du temps total de pause
	};
}
