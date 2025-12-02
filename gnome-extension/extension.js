import St from "gi://St";
import GLib from "gi://GLib";
import Clutter from "gi://Clutter";
import Soup from "gi://Soup?version=3.0";
import { Extension } from "resource:///org/gnome/shell/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";

// Imports des modules
import { fetchData } from "./modules/api.js";
import { formatDisplayText } from "./modules/display.js";
import { createMenu, updateMenuSwitches } from "./modules/menu.js";

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

		// 3. Charger les settings
		this._settings = this.getSettings("org.gnome.shell.extensions.42-logtime");

		// 4. Variables pour stocker les données
		this._sessions = []; // Liste des sessions
		this._currentPause = null; // Informations sur la pause en cours
		this._pauseStartTime = null; // Timestamp de début de pause pour calcul en temps réel
		this._displayTimeout = null; // Timer pour l'affichage

		// 5. Écouter les changements de settings
		this._settings.connect("changed::display-mode", () => {
			this._updateMenuSwitches();
			this._updateDisplay();
		});
		this._settings.connect("changed::show-departure-time", () => {
			this._updateMenuSwitches();
			this._updateDisplay();
		});

		// 6. Créer le menu popup
		this._menuItems = createMenu(
			this._indicator,
			this._settings,
			() => this._updateDisplay(),
			() => this._updateDisplay()
		);

		// 7. Lancer la première requête immédiatement
		this._fetchFromServer();

		// 8. Timer pour synchroniser avec le serveur toutes les 10 secondes
		this._serverTimeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 10, () => {
			this._fetchFromServer();
			return true; // Continuer la boucle
		});
	}

	_updateMenuSwitches() {
		updateMenuSwitches(this._menuItems, this._settings);
	}

	_fetchFromServer() {
		fetchData(this._session, (json, error) => {
			if (error) {
				log(`Erreur LogTime: ${error.message}`);
				this._label.set_text("Err: Connexion");
				return;
			}

			// Mettre à jour les sessions
			if (json.sessions !== undefined) {
				this._sessions = json.sessions || [];

				// Mettre à jour les informations de pause
				if (json.currentPause !== null && json.currentPause !== undefined) {
					this._currentPause = json.currentPause;
					// Si c'est une pause en cours, stocker le timestamp de début
					if (this._currentPause.isOngoing) {
						const now = new Date();
						this._pauseStartTime = now.getTime() / 1000 - this._currentPause.seconds;
					} else {
						this._pauseStartTime = null;
					}
				} else {
					this._currentPause = null;
					this._pauseStartTime = null;
				}

				// Mettre à jour l'affichage
				this._updateDisplay();

				// Démarrer/arrêter le timer d'affichage selon qu'il y a des sessions
				this._manageDisplayTimer();
			} else {
				this._label.set_text("Err: Pas de données");
			}
		});
	}

	_manageDisplayTimer() {
		// Arrêter le timer existant s'il y en a un
		if (this._displayTimeout) {
			GLib.source_remove(this._displayTimeout);
			this._displayTimeout = null;
		}

		// Démarrer le timer seulement si on a des sessions
		if (this._sessions && this._sessions.length > 0) {
			// Timer qui met à jour l'affichage toutes les secondes
			this._displayTimeout = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 1, () => {
				this._updateDisplay();
				return true; // Continuer la boucle
			});
		}
	}

	_updateDisplay() {
		const displayMode = this._settings.get_string("display-mode");
		const showDeparture = this._settings.get_boolean("show-departure-time");

		const formattedTime = formatDisplayText(this._sessions, this._currentPause, this._pauseStartTime, displayMode, showDeparture);

		this._label.set_text(formattedTime);
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
