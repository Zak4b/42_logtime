import http from "http";
import { SessionMonitor } from "./monitor.js";
import { calculateTotalSeconds, formatDuration } from "./utils.js";

export async function runServerMode(login) {
	const monitor = new SessionMonitor(login);

	const server = http.createServer((req, res) => {
		if (req.method !== "GET" || req.url !== "/") {
			res.writeHead(404, { "Content-Type": "application/json" });
			res.end(JSON.stringify({ error: "Not Found" }));
			return;
		}

		// Préparer les données
		const sessions = monitor.sessions;
		const totalSeconds = calculateTotalSeconds(sessions, new Date());
		const data = {
			login,
			sessions,
			totalLogtime: formatDuration(totalSeconds),
			totalSeconds,
			lastCheckTime: monitor.lastCheckTime,
			warning: monitor.warning,
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
