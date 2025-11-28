import readline from "readline";
import { formatDuration, formatTime, calculateTotalSeconds } from "./utils.js";

// Affiche les sessions avec header, sessions (ou message si vide), et logtime
export function renderSessions(locations, lastCheckTime = new Date(), login = null) {
	// Header
	if (login) {
		console.log(`👤 Login : ${login}`);
	}
	const timestamp = formatTime(lastCheckTime, true);
	console.log(`🕐 Dernière vérification : ${timestamp}`);

	// Sessions ou message si vide
	if (!locations || locations.length === 0) {
		console.log("❌ Aucune session trouvée pour aujourd'hui.");
	} else {
		// Trier les sessions par begin_at pour s'assurer qu'elles sont dans l'ordre chronologique
		const sortedLocations = [...locations].sort((a, b) => new Date(a.begin_at) - new Date(b.begin_at));

		for (let i = 0; i < sortedLocations.length; i++) {
			const loc = sortedLocations[i];
			const end = loc.end_at ? formatTime(new Date(loc.end_at)) : "  ...   ";

			// Calculer la durée de la session
			const start = new Date(loc.begin_at);
			const endTime = loc.end_at ? new Date(loc.end_at) : new Date();
			const durationSeconds = (endTime - start) / 1000;
			const duration = formatDuration(durationSeconds);

			console.log(`Poste: ${loc.host} | ${formatTime(loc.begin_at)} -> ${end} (${duration})`);

			// Afficher la pause entre les sessions (sauf pour la dernière session)
			if (i < sortedLocations.length - 1) {
				// On ne peut calculer la pause que si la session actuelle est terminée
				if (loc.end_at) {
					const currentEnd = new Date(loc.end_at);
					const nextBegin = new Date(sortedLocations[i + 1].begin_at);
					const pauseSeconds = (nextBegin - currentEnd) / 1000;

					if (pauseSeconds > 0) {
						console.log(`   ⏸️  Pause : ${formatDuration(pauseSeconds)}`);
					} else if (pauseSeconds < 0) {
						// Sessions qui se chevauchent (ne devrait pas arriver normalement)
						console.log(`   ⚠️  Chevauchement détecté`);
					}
					// Si pauseSeconds === 0, pas de pause à afficher
				}
				// Si la session actuelle n'est pas terminée, on n'affiche pas de pause
			}
		}
	}

	// Logtime
	console.log("-".repeat(40));
	const total = locations && locations.length > 0 ? calculateTotalSeconds(locations, new Date()) : 0;
	console.log(`⏱️  Total Logtime : ${formatDuration(total)}`);
}

export function clearLastLine() {
	// Déplace le curseur d'une ligne vers le haut et efface la ligne
	try {
		readline.moveCursor(process.stdout, 0, -1);
		readline.clearLine(process.stdout, 0);
		readline.cursorTo(process.stdout, 0);
	} catch (e) {
		// si l'opération échoue, ignore
	}
}
