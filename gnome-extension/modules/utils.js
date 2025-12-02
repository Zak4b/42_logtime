// Utilitaires pour les calculs et le formatage

/**
 * Calcule le temps total en secondes à partir des sessions
 */
export function calculateTotalSeconds(locations, now) {
	if (!locations || locations.length === 0) {
		return 0;
	}

	let totalSeconds = 0;
	// Trier par begin_at croissant
	const sortedLocations = [...locations].sort((a, b) => {
		return new Date(a.begin_at).getTime() - new Date(b.begin_at).getTime();
	});

	for (const loc of sortedLocations) {
		const start = new Date(loc.begin_at);
		const end = loc.end_at ? new Date(loc.end_at) : now;
		totalSeconds += (end.getTime() - start.getTime()) / 1000;
	}

	return totalSeconds;
}

/**
 * Formate une durée en secondes au format HHh MMm SSs
 */
export function formatDuration(seconds) {
	const s = Math.floor(seconds);
	const hours = Math.floor(s / 3600);
	const minutes = Math.floor((s % 3600) / 60);
	const secs = Math.floor(s % 60);

	const hoursStr = String(hours).padStart(2, "0");
	const minutesStr = String(minutes).padStart(2, "0");
	const secsStr = String(secs).padStart(2, "0");

	return `${hoursStr}h ${minutesStr}m ${secsStr}s`;
}

/**
 * Calcule le temps restant pour atteindre 7 heures
 */
export function calculateRemainingTime(totalSeconds, targetHours = 7) {
	const targetSeconds = targetHours * 3600;
	return Math.max(0, targetSeconds - totalSeconds);
}

/**
 * Calcule l'heure de départ pour atteindre 7 heures
 */
export function calculateDepartureTime(totalSeconds, targetHours = 7) {
	const remainingSeconds = calculateRemainingTime(totalSeconds, targetHours);
	if (remainingSeconds <= 0) {
		return null; // Déjà atteint
	}

	const now = new Date();
	return new Date(now.getTime() + remainingSeconds * 1000);
}

