// Fonctions utilitaires pour les calculs de temps

import GLib from "gi://GLib";

const REQUIRED_HOURS = 7; // 7 heures requises
const REQUIRED_SECONDS = REQUIRED_HOURS * 3600;

/**
 * Calcule le temps total de pause dans la journée
 */
export function calculateTotalPauseTime(sessions) {
	if (!sessions || sessions.length === 0) {
		return 0;
	}

	// Trier par begin_at croissant
	const sortedSessions = [...sessions].sort((a, b) => {
		const aTime = new Date(a.begin_at || a.begin).getTime();
		const bTime = new Date(b.begin_at || b.begin).getTime();
		return aTime - bTime;
	});

	let totalPauseSeconds = 0;

	// Calculer les pauses entre les sessions
	for (let i = 0; i < sortedSessions.length - 1; i++) {
		const currentSession = sortedSessions[i];
		const nextSession = sortedSessions[i + 1];

		const currentEndTime = currentSession.end_at || currentSession.end;
		if (currentEndTime) {
			const currentEnd = new Date(currentEndTime);
			const nextBegin = new Date(nextSession.begin_at || nextSession.begin);
			const pauseSeconds = (nextBegin.getTime() - currentEnd.getTime()) / 1000;

			if (pauseSeconds > 0) {
				totalPauseSeconds += pauseSeconds;
			}
		}
	}

	// Ajouter la pause en cours si la dernière session est terminée
	const lastSession = sortedSessions[sortedSessions.length - 1];
	if (lastSession) {
		const lastEndTime = lastSession.end_at || lastSession.end;
		if (lastEndTime) {
			const currentEnd = new Date(lastEndTime);
			const now = new Date();
			const pauseSeconds = (now.getTime() - currentEnd.getTime()) / 1000;
			if (pauseSeconds > 0) {
				totalPauseSeconds += pauseSeconds;
			}
		}
	}

	return totalPauseSeconds;
}

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
