import { API_URL } from './config.js';

export async function getLocationsToday(token, login) {
	const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
	const range = `${today}T00:00:00.000Z,${today}T23:59:59.000Z`;

	const url = new URL(`${API_URL}/users/${login}/locations`);
	url.searchParams.set("range[begin_at]", range);
	url.searchParams.set("sort", "begin_at");
	url.searchParams.set("page[size]", "100");

	const res = await fetch(url.toString(), {
		headers: { Authorization: `Bearer ${token}` },
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`Erreur API : ${text}`);
	}

	return res.json();
}

