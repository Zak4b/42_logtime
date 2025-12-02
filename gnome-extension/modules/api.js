// Gestion des requêtes HTTP vers le serveur

import Soup from "gi://Soup?version=3.0";
import GLib from "gi://GLib";

const SERVER_URL = "http://localhost:9655";

/**
 * Récupère les données depuis le serveur
 */
export function fetchData(session, callback) {
	const message = Soup.Message.new("GET", SERVER_URL);

	session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (session, result) => {
		try {
			const bytes = session.send_and_read_finish(result);

			if (message.status_code !== 200) {
				callback(null, new Error("HTTP " + message.status_code));
				return;
			}

			// Décoder le JSON
			const decoder = new TextDecoder("utf-8");
			const text = decoder.decode(bytes.get_data());
			const json = JSON.parse(text);

			callback(json, null);
		} catch (e) {
			callback(null, e);
		}
	});
}

