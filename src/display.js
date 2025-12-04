import readline from "readline";
import { formatDuration, formatTime, calculateTotalSeconds, getPauseInfo } from "./utils.js";

export function renderSessions(locations, lastCheckTime = new Date(), login = null) {
	if (login) {
		console.log(`👤 Login : ${login}`);
	}
	const timestamp = formatTime(lastCheckTime, true);
	console.log(`🕐 Dernière vérification : ${timestamp}`);

	if (!locations || locations.length === 0) {
		console.log("❌ Aucune session trouvée pour aujourd'hui.");
	} else {
		// Trier les sessions par begin_at pour s'assurer qu'elles sont dans l'ordre chronologique
		const sortedLocations = [...locations].sort((a, b) => new Date(a.begin_at) - new Date(b.begin_at));
		const total = calculateTotalSeconds(locations, new Date());

		for (let i = 0; i < sortedLocations.length; i++) {
			const loc = sortedLocations[i];
			const end = loc.end_at ? formatTime(new Date(loc.end_at)) : "  ...   ";

			// Calculer la durée de la session
			const start = new Date(loc.begin_at);
			const endTime = loc.end_at ? new Date(loc.end_at) : new Date();
			const durationSeconds = (endTime - start) / 1000;
			const duration = formatDuration(durationSeconds);

			console.log(`Poste: ${loc.host} | ${formatTime(loc.begin_at)} -> ${end} (${duration})`);

			const pauseInfo = getPauseInfo(i, sortedLocations, total);
			if (pauseInfo) {
				console.log(`   ⏸️  ${pauseInfo.label} : ${pauseInfo.formatted}`);
			}
		}
	}

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
		// ignore
	}
}
