import { USER_LOGIN } from "./config.js";
import { runShellMode } from "./shell.js";
import { runServerMode } from "./server.js";
import minimist from "minimist";

const args = minimist(process.argv.slice(2), {
	boolean: ["server"],
	default: {
		server: false,
	},
});

const login = args._[0] || USER_LOGIN;
const serverMode = args.server;

if (!login) {
	console.error("Use 'npm start <login>' or set USER_LOGIN in the .env file");
	process.exit(1);
}

if (serverMode) {
	await runServerMode(login);
} else {
	await runShellMode(login);
}
