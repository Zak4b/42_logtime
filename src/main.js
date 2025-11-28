import { USER_LOGIN } from "./config.js";
import { runShellMode } from "./shell.js";
import { runServerMode } from "./server.js";
import minimist from "minimist";

const args = minimist(process.argv.slice(2), {
	boolean: ["server"], // --server est un flag booléen
	default: {
		server: false,
	},
});

const login = args._[0] || USER_LOGIN; // Premier argument positionnel
const serverMode = args.server; // true si --server présent

if (!login) {
	console.error("❌ Erreur : Aucun login fourni. Utilisez 'npm start <login>' ou configurez USER_LOGIN dans le fichier .env");
	process.exit(1);
}

if (serverMode) {
	await runServerMode(login);
} else {
	await runShellMode(login);
}
