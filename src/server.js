import http from "http";
import { SessionMonitor } from "./monitor.js";
import { getPauseInfo } from "./utils.js";

export async function runServerMode(login) {
	const monitor = new SessionMonitor(login);

	const server = http.createServer((req, res) => {
		if (req.method !== "GET" || req.url !== "/") {
			res.writeHead(404, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Not Found" }));
			return;
		}

		const sessionsData = monitor.sessionsData;
		const sessions = sessionsData.sessions;

		// Calculer la pause en cours (dernière session si applicable)
		let currentPause = null;
		if (sessions.length > 0) {
			// Trier les sessions pour le calcul
			const sortedSessions = [...sessions].sort((a, b) => new Date(a.begin_at) - new Date(b.begin_at));
			currentPause = getPauseInfo(sortedSessions.length - 1, sortedSessions, sessionsData.totalSeconds);
		}

		const data = {
			login,
			sessions,
			totalLogtime: sessionsData.totalLogtime,
			totalSeconds: sessionsData.totalSeconds,
			lastCheckTime: sessionsData.lastCheckTime,
			warning: monitor.warning,
			currentPause,
		};

		// Envoyer la réponse JSON
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify(data, null, 2));
	});

	const PORT = process.env.PORT || 9655;
	server.listen(PORT, () => {
		console.log(`Serveur démarré sur http://localhost:${PORT}`);
	});

	// Gestion des erreurs du monitor
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

	// Nettoyage à la sortie
	function stop() {
		monitor.stop();
		server.close();
	}

	process.on("SIGINT", () => {
		stop();
		console.log("\nServeur arrêté.");
		process.exit();
	});
}
