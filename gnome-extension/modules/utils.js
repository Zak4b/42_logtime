// Fonctions utilitaires pour les calculs de temps

import GLib from "gi://GLib";

const REQUIRED_HOURS = 7; // 7 heures requises
const REQUIRED_SECONDS = REQUIRED_HOURS * 3600;

/**
 * Calcule le temps total des sessions (en secondes)
 */
export function calculateTotalSeconds(sessions, now) {
	if (!sessions || sessions.length === 0) {
		return 0;
	}

	let totalSeconds = 0;

	for (let session of sessions) {
		// Support pour begin_at/end_at (API) et begin/end (ancien format)
		const beginTime = session.begin_at || session.begin;
		const endTime = session.end_at || session.end;
		
		if (beginTime !== undefined && endTime !== undefined && endTime !== null) {
			// Session complète
			const begin = new Date(beginTime);
			const end = new Date(endTime);
			totalSeconds += (end - begin) / 1000;
		} else if (beginTime !== undefined) {
			// Session en cours
			const begin = new Date(beginTime);
			totalSeconds += (now - begin) / 1000;
		}
	}

	return Math.floor(totalSeconds);
}

/**
 * Formate une durée en secondes au format "Xh Ym Zs"
 */
export function formatDuration(seconds) {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	const hoursStr = String(hours).padStart(2, "0");
	const minutesStr = String(minutes).padStart(2, "0");
	const secsStr = String(secs).padStart(2, "0");

	return `${hoursStr}h ${minutesStr}m ${secsStr}s`;
}

/**
 * Calcule le temps restant avant d'atteindre 7h
 */
export function calculateRemainingTime(totalSeconds) {
	const remaining = REQUIRED_SECONDS - totalSeconds;
	return remaining > 0 ? remaining : 0;
}

/**
 * Calcule l'heure de départ estimée (quand les 7h seront atteintes)
 */
export function calculateDepartureTime(totalSeconds) {
	const remainingSeconds = calculateRemainingTime(totalSeconds);

	if (remainingSeconds === 0) {
		return null; // Peut déjà partir
	}

	const now = new Date();
	const departureTime = new Date(now.getTime() + remainingSeconds * 1000);

	return departureTime;
}
