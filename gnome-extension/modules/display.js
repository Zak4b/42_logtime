// Logique d'affichage et formatage

import GLib from "gi://GLib";
import { calculateTotalSeconds, formatDuration, calculateRemainingTime, calculateDepartureTime } from "./utils.js";

/**
 * Formate le temps de pause
 */
function formatPause(pauseSeconds) {
	const pauseHours = Math.floor(pauseSeconds / 3600);
	const pauseMinutes = Math.floor((pauseSeconds % 3600) / 60);
	const pauseSecs = Math.floor(pauseSeconds % 60);

	const pauseHoursStr = String(pauseHours).padStart(2, "0");
	const pauseMinutesStr = String(pauseMinutes).padStart(2, "0");
	const pauseSecsStr = String(pauseSecs).padStart(2, "0");

	return `${pauseHoursStr}h ${pauseMinutesStr}m ${pauseSecsStr}s`;
}

/**
 * Calcule le temps de pause en temps réel si nécessaire
 */
export function getCurrentPauseSeconds(currentPause, pauseStartTime) {
	if (!currentPause) {
		return null;
	}

	let pauseSeconds = currentPause.seconds;

	// Si c'est une pause en cours, calculer le temps écoulé en temps réel
	if (currentPause.isOngoing && pauseStartTime !== null) {
		const now = GLib.get_real_time() / 1000000; // Temps actuel en secondes
		pauseSeconds = now - pauseStartTime;
	}

	return pauseSeconds;
}

/**
 * Formate le texte à afficher selon le mode et les options
 */
export function formatDisplayText(sessions, currentPause, pauseStartTime, displayMode, showDeparture) {
	const totalSeconds = calculateTotalSeconds(sessions, new Date());
	let formattedTime = "";

	// Afficher selon le mode sélectionné
	if (displayMode === "remaining") {
		// Mode : Temps restant
		const remainingSeconds = calculateRemainingTime(totalSeconds);

		if (remainingSeconds > 0) {
			formattedTime = "Reste: " + formatDuration(remainingSeconds);
		} else {
			formattedTime = "✓ 7h atteint";
		}
	} else {
		// Mode : Logtime (par défaut)
		formattedTime = formatDuration(totalSeconds);

		// Ajouter l'indicateur de pause si currentPause n'est pas null
		const pauseSeconds = getCurrentPauseSeconds(currentPause, pauseStartTime);
		if (pauseSeconds !== null) {
			const formattedPause = formatPause(pauseSeconds);
			formattedTime = formattedTime + " ⏸️ " + formattedPause;
		}
	}

	// Ajouter l'heure de départ si activé
	if (showDeparture) {
		const departureTime = calculateDepartureTime(totalSeconds);

		if (departureTime) {
			const depHours = String(departureTime.getHours()).padStart(2, "0");
			const depMinutes = String(departureTime.getMinutes()).padStart(2, "0");
			const depSecs = String(departureTime.getSeconds()).padStart(2, "0");

			formattedTime = formattedTime + " | Départ: " + depHours + ":" + depMinutes + ":" + depSecs;
		} else {
			formattedTime = formattedTime + " | ✓ Peut partir";
		}
	}

	return formattedTime;
}
