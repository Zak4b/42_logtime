import { EventEmitter } from "events";
import { getAccessToken } from "./auth.js";
import { getLocationsToday } from "./api.js";
import { calculateTotalSeconds, formatDuration } from "./utils.js";
import { sendWarningNotification, sendSuccessNotification } from "./notifications.js";

export class SessionMonitor extends EventEmitter {
	constructor(login) {
		super();
		this.login = login;
		this._sessions = {
			sessions: [],
			totalLogtime: "00h 00m 00s",
			totalSeconds: 0,
			lastCheckTime: null,
		};
		this._lastCheckTime = null;
		this._refreshInterval = null;
		this._isRunning = false;
		this._warning = null;
	}

	get sessions() {
		return this._sessions.sessions;
	}

	get sessionsData() {
		return this._sessions;
	}

	get lastCheckTime() {
		return this._lastCheckTime;
	}

	get warning() {
		return this._warning;
	}

	async start() {
		if (this._isRunning) {
			return;
		}

		this._isRunning = true;

		try {
			// Requête initiale
			await this._fetchSessions();

			this._refreshInterval = setInterval(async () => {
				await this._fetchSessions();
			}, 60 * 1000);
		} catch (error) {
			this._isRunning = false;
			this.emit("error", error);
		}
	}

	stop() {
		if (this._refreshInterval) {
			clearInterval(this._refreshInterval);
			this._refreshInterval = null;
		}
		this._isRunning = false;
	}

	async _fetchSessions() {
		try {
			const token = await getAccessToken();
			const rawSessions = await getLocationsToday(token, this.login);
			const sessionsArray = rawSessions || [];
			const checkTime = new Date();

			const transformedSessions = sessionsArray.map((session) => ({
				begin_at: session.begin_at,
				end_at: session.end_at,
				id: session.id,
				host: session.host,
				user: {
					id: session.user?.id,
					login: session.user?.login,
				},
			}));

			const totalSeconds = calculateTotalSeconds(sessionsArray, new Date());
			const totalLogtime = formatDuration(totalSeconds);

			const newSessionsData = {
				sessions: transformedSessions,
				totalLogtime,
				totalSeconds,
				lastCheckTime: checkTime,
			};

			const isFirstFetch = this._sessions.sessions.length === 0 && this._lastCheckTime === null;
			const hasChanged = isFirstFetch || this._hasSessionsChanged(newSessionsData);

			this._sessions = newSessionsData;
			this._lastCheckTime = checkTime;

			const previousWarning = this._warning;
			const previousTotalSeconds = this._sessions.totalSeconds;
			this._checkWarning();

			// Émettre un événement warning si le statut a changé
			if (this._warning !== previousWarning) {
				this.emit("warning", {
					warning: this._warning,
					sessions: this._sessions,
				});

				// Envoyer une notification si warning activé
				if (this._warning !== null && this._sessions.sessions.length > 0) {
					const lastSession = this._sessions.sessions[this._sessions.sessions.length - 1];
					const lastSessionEnd = new Date(lastSession.end_at);
					sendWarningNotification(this.login, this._sessions.totalSeconds, this._sessions.totalLogtime, lastSessionEnd).catch((err) => console.error("Erreur notification:", err));
				}
			}

			if (previousWarning === null && previousTotalSeconds < 7 * 3600 && this._sessions.totalSeconds >= 7 * 3600) {
				sendSuccessNotification(this.login, this._sessions.totalLogtime).catch((err) => console.error("Erreur notification:", err));
			}

			this.emit("change", {
				sessions: this._sessions,
				lastCheckTime: this._lastCheckTime,
				sessionsChanged: hasChanged,
			});
		} catch (error) {
			this.emit("error", error);
		}
	}

	_hasSessionsChanged(newSessionsData) {
		const newSessions = newSessionsData.sessions;
		const oldSessions = this._sessions.sessions;
		if (oldSessions.length !== newSessions.length) {
			return true;
		}

		for (let i = 0; i < newSessions.length; i++) {
			const oldSession = oldSessions[i];
			const newSession = newSessions[i];

			if (!oldSession) return true;

			if (oldSession.begin_at !== newSession.begin_at || oldSession.end_at !== newSession.end_at || oldSession.host !== newSession.host) {
				return true;
			}
		}

		return false;
	}

	_checkWarning() {
		// Pas de session
		if (this._sessions.sessions.length === 0) {
			this._warning = null;
			return;
		}

		// Logtime >= 7h : pas d'alerte
		const totalSeconds = this._sessions.totalSeconds;
		const sevenHoursInSeconds = 7 * 3600;
		if (totalSeconds >= sevenHoursInSeconds) {
			this._warning = null;
			return;
		}

		const lastSession = this._sessions.sessions[this._sessions.sessions.length - 1];

		// Si la dernière session n'est pas terminée, pas d'alerte
		if (!lastSession.end_at) {
			this._warning = null;
			return;
		}

		const lastSessionEnd = new Date(lastSession.end_at);
		const now = new Date();
		const minutesSinceLastSession = Math.floor((now - lastSessionEnd) / 1000 / 60); // en minutes
		const fifteenMinutes = 15;

		if (minutesSinceLastSession >= fifteenMinutes) {
			const hours = Math.floor(totalSeconds / 3600);
			const minutes = Math.floor((totalSeconds % 3600) / 60);
			this._warning = {
				message: `Logtime insuffisant (${hours}h ${minutes}m) et inactivité depuis ${minutesSinceLastSession} minutes. Objectif: 7h minimum.`,
			};
		} else {
			this._warning = null;
		}
	}
}
