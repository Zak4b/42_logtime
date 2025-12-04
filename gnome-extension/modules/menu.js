// Gestion du menu popup

import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";

/**
 * Crée le menu popup avec les options d'affichage
 */
export function createMenu(indicator, settings, onDisplayModeChange, onDepartureTimeChange) {
	// Section pour les options d'affichage
	const displaySection = new PopupMenu.PopupMenuSection();
	indicator.menu.addMenuItem(displaySection);

	// Une seule checkbox qui bascule entre logtime et temps restant
	const currentMode = settings.get_string("display-mode");
	const isRemainingMode = currentMode === "remaining";
	const displayModeItem = new PopupMenu.PopupSwitchMenuItem("Afficher le temps restant", isRemainingMode);

	displayModeItem.connect("toggled", () => {
		// Bascule entre les deux modes
		const newMode = displayModeItem.state ? "remaining" : "logtime";
		settings.set_string("display-mode", newMode);
		if (onDisplayModeChange) {
			onDisplayModeChange();
		}
	});
	displaySection.addMenuItem(displayModeItem);

	// Séparateur
	indicator.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

	// Option : Afficher l'heure de départ
	const showDeparture = settings.get_boolean("show-departure-time");
	const departureTimeItem = new PopupMenu.PopupSwitchMenuItem("Afficher l'heure de départ", showDeparture);

	departureTimeItem.connect("toggled", () => {
		settings.set_boolean("show-departure-time", departureTimeItem.state);
		if (onDepartureTimeChange) {
			onDepartureTimeChange();
		}
	});
	indicator.menu.addMenuItem(departureTimeItem);

	return {
		displayModeItem,
		departureTimeItem,
	};
}

/**
 * Met à jour les switches du menu pour refléter l'état actuel des settings
 */
export function updateMenuSwitches(menuItems, settings) {
	if (menuItems.displayModeItem) {
		const currentMode = settings.get_string("display-mode");
		menuItems.displayModeItem.setToggleState(currentMode === "remaining");
	}

	if (menuItems.departureTimeItem) {
		const showDeparture = settings.get_boolean("show-departure-time");
		menuItems.departureTimeItem.setToggleState(showDeparture);
	}
}
