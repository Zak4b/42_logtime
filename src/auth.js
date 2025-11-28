import { CLIENT_ID, CLIENT_SECRET, TOKEN_URL } from './config.js';

export async function getAccessToken() {
	const body = new URLSearchParams({
		grant_type: "client_credentials",
		client_id: CLIENT_ID,
		client_secret: CLIENT_SECRET,
	});

	const res = await fetch(TOKEN_URL, {
		method: "POST",
		body,
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Erreur d'authentification : ${text}`);
	}

	const j = await res.json();
	return j.access_token;
}

