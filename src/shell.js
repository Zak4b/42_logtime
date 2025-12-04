import { SessionMonitor } from "./monitor.js";
import { calculateTotalSeconds, formatDuration } from "./utils.js";
import { renderSessions, clearLastLine } from "./display.js";

export async function runShellMode(login) {
	let timerInterval = null;

	const monitor = new SessionMonitor(login);

	function displaySessions() {
		const sessions = monitor.sessions;
		const lastCheckTime = monitor.lastCheckTime;

		console.clear();
		renderSessions(sessions, lastCheckTime, login);

		// Démarrer le timer qui met à jour la dernière ligne chaque seconde (seulement si on a des sessions)
		if (sessions && sessions.length > 0) {
			if (timerInterval) clearInterval(timerInterval);
			timerInterval = setInterval(() => {
				const currentSessions = monitor.sessions;
				const total = calculateTotalSeconds(currentSessions, new Date());
				// remplacer la dernière ligne imprimée (le total)
				clearLastLine();
				process.stdout.write(`⏱️  Total Logtime : ${formatDuration(total)}\n`);
			}, 1000);
		} else {
			// Arrêter le timer s'il n'y a pas de sessions
			if (timerInterval) {
				clearInterval(timerInterval);
				timerInterval = null;
			}
		}
	}

	monitor.on("change", () => displaySessions());

	monitor.on("error", (error) => {
		console.error(`❌ Erreur : ${error.message || error}`);
	});

	// Démarrer le monitoring
	try {
		await monitor.start();
	} catch (error) {
		console.error(`❌ Erreur au démarrage : ${error.message || error}`);
		process.exitCode = 1;
	}

	function stop() {
		if (timerInterval) clearInterval(timerInterval);
		monitor.stop();
	}

	process.on("SIGINT", () => {
		stop();
		console.log("\nInterrompu.");
		process.exit();
	});
}

