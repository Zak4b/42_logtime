import { EventEmitter } from "events";
import { getAccessToken } from "./auth.js";
import { getLocationsToday } from "./api.js";
import { calculateTotalSeconds } from "./utils.js";

export class SessionMonitor extends EventEmitter {
	constructor(login) {
		super();
		this.login = login;
		this._sessions = [];
		this._lastCheckTime = null;
		this._refreshInterval = null;
		this._isRunning = false;
		this._warning = false;
	}

	// Getter pour accéder aux sessions
	get sessions() {
		return this._sessions;
	}

	// Getter pour accéder à la dernière vérification
	get lastCheckTime() {
		return this._lastCheckTime;
	}

	// Getter pour accéder au warning
	get warning() {
		return this._warning;
	}

	// Démarrer le monitoring
	async start() {
		if (this._isRunning) {
			return;
		}

		this._isRunning = true;

		try {
			// Requête initiale à l'instanciation
			await this._fetchSessions();

			// Re-fetch toutes les 60s
			this._refreshInterval = setInterval(async () => {
				await this._fetchSessions();
			}, 60 * 1000);
		} catch (error) {
			this._isRunning = false;
			this.emit("error", error);
		}
	}

	// Arrêter le monitoring
	stop() {
		if (this._refreshInterval) {
			clearInterval(this._refreshInterval);
			this._refreshInterval = null;
		}
		this._isRunning = false;
	}

	// Méthode privée pour récupérer les sessions
	async _fetchSessions() {
		try {
			const token = await getAccessToken();
			const newSessions = await getLocationsToday(token, this.login);
			const sessionsArray = newSessions || [];
			const checkTime = new Date();

			// Vérifier s'il y a un changement (ou si c'est la première fois)
			const isFirstFetch = this._sessions.length === 0 && this._lastCheckTime === null;
			const hasChanged = isFirstFetch || this._hasSessionsChanged(sessionsArray);

			// Mettre à jour les sessions
			this._sessions = sessionsArray;
			this._lastCheckTime = checkTime;

			// Vérifier le warning
			const previousWarning = this._warning;
			this._checkWarning();

			// Émettre un événement warning si le statut a changé
			if (this._warning !== previousWarning) {
				this.emit("warning", {
					warning: this._warning,
					sessions: this._sessions,
				});
			}

			// Émettre l'événement de changement (toujours pour mettre à jour la date de vérification)
			this.emit("change", {
				sessions: this._sessions,
				lastCheckTime: this._lastCheckTime,
				sessionsChanged: hasChanged,
			});
		} catch (error) {
			this.emit("error", error);
		}
	}

	// Vérifier si les sessions ont changé
	_hasSessionsChanged(newSessions) {
		// Comparaison simple : nombre de sessions différent
		if (this._sessions.length !== newSessions.length) {
			return true;
		}

		// Comparaison plus approfondie : vérifier les IDs ou les timestamps
		// On compare les begin_at et end_at pour détecter les changements
		for (let i = 0; i < newSessions.length; i++) {
			const oldSession = this._sessions[i];
			const newSession = newSessions[i];

			if (!oldSession) return true;

			// Comparer les propriétés importantes
			if (oldSession.begin_at !== newSession.begin_at || oldSession.end_at !== newSession.end_at || oldSession.host !== newSession.host) {
				return true;
			}
		}

		return false;
	}

	_checkWarning() {
		// 1 session
		if (this._sessions.length === 0) {
			this._warning = false;
			return;
		}

		// Logtime < 7h
		const totalSeconds = calculateTotalSeconds(this._sessions, new Date());
		const sevenHoursInSeconds = 7 * 3600;
		if (totalSeconds >= sevenHoursInSeconds) {
			this._warning = false;
			return;
		}

		const lastSession = this._sessions[this._sessions.length - 1];

		const lastSessionEnd = new Date(lastSession.end_at);
		const now = new Date();
		const minutesSinceLastSession = (now - lastSessionEnd) / 1000 / 60; // en minutes
		const fifteenMinutes = 15;

		this._warning = minutesSinceLastSession >= fifteenMinutes;
	}
}
