import St from "gi://St";
import GLib from "gi://GLib";
import Clutter from "gi://Clutter";
import Soup from "gi://Soup?version=3.0";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

export default class LogTimeExtension extends Extension {
	enable() {
		// 1. Création du bouton dans la barre
		this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);

		// Création du label (texte)
		this._label = new St.Label({
			text: "Chargement...",
			y_align: Clutter.ActorAlign.CENTER,
		});

		this._indicator.add_child(this._label);

		// Ajout à la barre supérieure (status area)
		Main.panel.addToStatusArea(this.uuid, this._indicator);

		// 2. Configuration de la session HTTP (Soup 3)
		this._session = new Soup.Session();
		this._session.timeout = 5; // Timeout de 5 secondes

		// 3. Variables pour stocker les données (comme runShellMode)
		this._sessions = []; // Liste des sessions
		this._currentPause = null; // Informations sur la pause en cours
		this._pauseStartTime = null; // Timestamp de début de pause pour calcul en temps réel
		this._displayTimeout = null; // Timer pour l'affichage

		// 4. Lancer la première requête immédiatement
		this._fetchFromServer();

		// 5. Timer pour synchroniser avec le serveur toutes les 10 secondes
		this._serverTimeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 10, () => {
			this._fetchFromServer();
			return true; // Continuer la boucle
		});
	}

	_fetchFromServer() {
		// Préparer la requête
		let message = Soup.Message.new("GET", "http://localhost:9655");

		// Envoyer la requête de manière asynchrone
		this._session.send_and_read_async(message, GLib.PRIORITY_DEFAULT, null, (session, result) => {
			try {
				const bytes = session.send_and_read_finish(result);

				if (message.status_code !== 200) {
					this._label.set_text("Err: HTTP " + message.status_code);
					return;
				}

				// Décoder le JSON
				const decoder = new TextDecoder("utf-8");
				const text = decoder.decode(bytes.get_data());
				const json = JSON.parse(text);

				// Mettre à jour les sessions (comme dans runShellMode)
				if (json.sessions !== undefined) {
					this._sessions = json.sessions || [];

					// Mettre à jour les informations de pause
					if (json.currentPause !== null && json.currentPause !== undefined) {
						this._currentPause = json.currentPause;
						// Si c'est une pause en cours, stocker le timestamp de début
						if (this._currentPause.isOngoing) {
							// Calculer le timestamp de début de la pause
							const now = new Date();
							this._pauseStartTime = now.getTime() / 1000 - this._currentPause.seconds;
						} else {
							this._pauseStartTime = null;
						}
					} else {
						this._currentPause = null;
						this._pauseStartTime = null;
					}

					// Mettre à jour l'affichage (comme displaySessions dans runShellMode)
					this._updateDisplay();

					// Démarrer/arrêter le timer d'affichage selon qu'il y a des sessions
					this._manageDisplayTimer();
				} else {
					this._label.set_text("Err: Pas de données");
				}
			} catch (e) {
				// Gestion des erreurs (API éteinte, JSON invalide, etc.)
				log(`Erreur LogTime: ${e.message}`);
				this._label.set_text("Err: Connexion");
			}
		});
	}

	_manageDisplayTimer() {
		// Arrêter le timer existant s'il y en a un
		if (this._displayTimeout) {
			GLib.source_remove(this._displayTimeout);
			this._displayTimeout = null;
		}

		// Démarrer le timer seulement si on a des sessions (comme dans runShellMode)
		if (this._sessions && this._sessions.length > 0) {
			// Timer qui met à jour l'affichage toutes les secondes
			this._displayTimeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
				this._updateDisplay();
				return true; // Continuer la boucle
			});
		}
	}

	_updateDisplay() {
		// Calculer le temps total comme dans runShellMode avec calculateTotalSeconds(sessions, new Date())
		const totalSeconds = this._calculateTotalSeconds(this._sessions, new Date());

		// Formater le temps (HHh MMm SSs) - comme formatDuration dans utils.js
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = Math.floor(totalSeconds % 60);

		const hoursStr = String(hours).padStart(2, "0");
		const minutesStr = String(minutes).padStart(2, "0");
		const secondsStr = String(seconds).padStart(2, "0");

		let formattedTime = `${hoursStr}h ${minutesStr}m ${secondsStr}s`;

		// Ajouter l'indicateur de pause si currentPause n'est pas null
		if (this._currentPause !== null) {
			let pauseSeconds = this._currentPause.seconds;

			// Si c'est une pause en cours, calculer le temps écoulé en temps réel
			if (this._currentPause.isOngoing && this._pauseStartTime !== null) {
				const now = GLib.get_real_time() / 1000000; // Temps actuel en secondes
				pauseSeconds = now - this._pauseStartTime;
			}

			// Formater la durée de pause
			const pauseHours = Math.floor(pauseSeconds / 3600);
			const pauseMinutes = Math.floor((pauseSeconds % 3600) / 60);
			const pauseSecs = Math.floor(pauseSeconds % 60);

			const pauseHoursStr = String(pauseHours).padStart(2, "0");
			const pauseMinutesStr = String(pauseMinutes).padStart(2, "0");
			const pauseSecsStr = String(pauseSecs).padStart(2, "0");

			const formattedPause = `${pauseHoursStr}h ${pauseMinutesStr}m ${pauseSecsStr}s`;
			formattedTime = `${formattedTime} ⏸️ ${formattedPause}`;
		}

		this._label.set_text(formattedTime);
	}

	// Réplique calculateTotalSeconds de utils.js
	_calculateTotalSeconds(locations, now) {
		if (!locations || locations.length === 0) {
			return 0;
		}

		let totalSeconds = 0;
		// Trier par begin_at croissant (comme dans utils.js)
		const sortedLocations = [...locations].sort((a, b) => {
			return new Date(a.begin_at).getTime() - new Date(b.begin_at).getTime();
		});

		for (const loc of sortedLocations) {
			const start = new Date(loc.begin_at);
			const end = loc.end_at ? new Date(loc.end_at) : now;
			totalSeconds += (end.getTime() - start.getTime()) / 1000;
		}

		return totalSeconds;
	}

	disable() {
		// Nettoyage lors de la désactivation de l'extension
		if (this._serverTimeout) {
			GLib.source_remove(this._serverTimeout);
			this._serverTimeout = null;
		}

		if (this._displayTimeout) {
			GLib.source_remove(this._displayTimeout);
			this._displayTimeout = null;
		}

		if (this._indicator) {
			this._indicator.destroy();
			this._indicator = null;
		}

		if (this._session) {
			this._session.abort();
			this._session = null;
		}
	}
}
