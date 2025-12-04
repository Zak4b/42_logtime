// Logique d'affichage et formatage

import GLib from "gi://GLib";
import { calculateTotalSeconds, formatDuration, calculateRemainingTime, calculateDepartureTime, calculateTotalPauseTime } from "./utils.js";

/**
 * Formate le temps de pause avec indicateur de validation
 */
function formatPause(pauseSeconds, totalDailyPause) {
	const pauseHours = Math.floor(pauseSeconds / 3600);
	const pauseMinutes = Math.floor((pauseSeconds % 3600) / 60);
	const pauseSecs = Math.floor(pauseSeconds % 60);

	const pauseHoursStr = String(pauseHours).padStart(2, "0");
	const pauseMinutesStr = String(pauseMinutes).padStart(2, "0");
	const pauseSecsStr = String(pauseSecs).padStart(2, "0");

	const timeStr = `${pauseHoursStr}h ${pauseMinutesStr}m ${pauseSecsStr}s`;
	
	// Vérifier si les 20 minutes de pause minimum sont atteintes
	const REQUIRED_PAUSE_SECONDS = 20 * 60; // 20 minutes
	if (totalDailyPause >= REQUIRED_PAUSE_SECONDS) {
		return `✓ ${timeStr}`; // Pause validée
	} else {
		return `⏳ ${timeStr}`; // Pause en attente (rappel de faire une pause)
	}
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
			formattedTime = "✅ 7h atteint";
		}
	} else {
		// Mode : Logtime (par défaut)
		formattedTime = formatDuration(totalSeconds);
	}

	// Calculer le temps total de pause de la journée (toujours afficher)
	const totalDailyPause = calculateTotalPauseTime(sessions);
	const REQUIRED_PAUSE_SECONDS = 20 * 60; // 20 minutes
	
	// Ajouter l'indicateur de pause dans tous les modes
	const pauseSeconds = getCurrentPauseSeconds(currentPause, pauseStartTime);
	if (pauseSeconds !== null && currentPause) {
		// Il y a une pause en cours
		const formattedPause = formatPause(pauseSeconds, totalDailyPause);
		formattedTime = formattedTime + " ⏸️ " + formattedPause;
	} else if (totalSeconds > 0) {
		// Pas de pause en cours, afficher le statut de validation
		if (totalDailyPause >= REQUIRED_PAUSE_SECONDS) {
			// Les 20 minutes sont atteintes
			formattedTime = formattedTime + " | ✅ Pause OK";
		} else {
			// Les 20 minutes ne sont pas encore atteintes
			formattedTime = formattedTime + " | ⏳ Pause requise";
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
			formattedTime = formattedTime + " | ✅ Peut partir";
		}
	}

	return formattedTime;
}
