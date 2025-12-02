import { NTFY_TOPIC, NTFY_PASSWORD } from "./config.js";

/**
 * Envoie une notification push via ntfy.sh
 * @param {string} title - Titre de la notification
 * @param {string} message - Message de la notification
 * @param {string} priority - Priorité (default, high, urgent)
 * @param {string[]} tags - Tags pour la notification (emoji, etc.)
 */
export async function sendNotification(title, message, priority = "default", tags = []) {
	if (!NTFY_TOPIC) {
		// Mode silencieux si pas de topic configuré
		return;
	}

	try {
		const url = `https://ntfy.sh/${NTFY_TOPIC}`;

		// Retirer les emojis du titre (les en-têtes HTTP ne supportent pas les emojis)
		const titleWithoutEmoji = title
			.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{24C2}-\u{1F251}]/gu, "")
			.trim();

		// Filtrer les emojis des tags (les en-têtes HTTP ne supportent pas les emojis)
		const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{24C2}-\u{1F251}]/gu;
		const cleanTags = tags.map((tag) => tag.replace(emojiRegex, "").trim()).filter((tag) => tag.length > 0);

		const headers = {
			"Content-Type": "text/plain; charset=utf-8",
			Title: titleWithoutEmoji,
			Priority: priority,
		};

		if (cleanTags.length > 0) {
			headers.Tags = cleanTags.join(",");
		}

		if (NTFY_PASSWORD) {
			headers.Authorization = `Basic ${Buffer.from(`:${NTFY_PASSWORD}`).toString("base64")}`;
		}

		const response = await fetch(url, {
			method: "POST",
			headers,
			body: message,
		});

		if (!response.ok) {
			throw new Error(response.statusText);
		}
	} catch (error) {
		throw new Error(`Erreur lors de l'envoi de la notification: ${error.message}`);
	}
}

/**
 * Envoie une notification d'alerte pour le logtime
 * @param {string} login - Login de l'utilisateur
 * @param {number} totalSeconds - Total de logtime en secondes
 * @param {string} totalLogtime - Total de logtime formaté
 * @param {Date} lastSessionEnd - Date de fin de la dernière session
 */
export async function sendWarningNotification(login, totalSeconds, totalLogtime, lastSessionEnd) {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const now = new Date();
	const minutesSinceLastSession = Math.floor((now - lastSessionEnd) / 1000 / 60);

	const title = `Alerte Logtime - ${login}`;
	const message = `Logtime actuel: ${totalLogtime} (${hours}h ${minutes}m)\n` + `Dernière session: il y a ${minutesSinceLastSession} minutes\n` + `Objectif: 7h minimum`;

	await sendNotification(title, message, "high", ["warning", "clock", "⚠️"]);
}

/**
 * Envoie une notification de succès quand le logtime atteint 7h
 * @param {string} login - Login de l'utilisateur
 * @param {string} totalLogtime - Total de logtime formaté
 */
export async function sendSuccessNotification(login, totalLogtime) {
	const title = `Objectif atteint - ${login}`;
	const message = `Félicitations ! Vous avez atteint ${totalLogtime} de logtime aujourd'hui.`;

	await sendNotification(title, message, "default", ["white_check_mark", "tada", "✅"]);
}
