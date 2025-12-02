import { sendNotification, sendWarningNotification, sendSuccessNotification } from "./notifications.js";
import { NTFY_TOPIC } from "./config.js";

/**
 * Script de test pour les notifications
 */
async function testNotifications() {
	console.log("🧪 Test des notifications ntfy.sh\n");

	if (!NTFY_TOPIC) {
		console.error("❌ Erreur: NTFY_TOPIC n'est pas configuré dans votre .env");
		console.log("\n💡 Ajoutez NTFY_TOPIC=votre-topic-ici dans votre fichier .env");
		process.exit(1);
	}

	console.log(`📱 Topic configuré: ${NTFY_TOPIC}`);
	console.log("Envoi des notifications de test...\n");

	try {
		// Test 1: Notification simple
		console.log("1️⃣  Test notification simple...");
		await sendNotification("🧪 Test Notification", "Ceci est une notification de test depuis 42_logtime !", "default", ["test"]);
		console.log("   ✅ Notification simple envoyée\n");
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Test 2: Notification de priorité haute
		console.log("2️⃣  Test notification priorité haute...");
		await sendNotification("🔔 Test Priorité Haute", "Notification avec priorité élevée", "high", ["warning"]);
		console.log("   ✅ Notification haute priorité envoyée\n");
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Test 3: Notification d'alerte (warning)
		console.log("3️⃣  Test notification d'alerte...");
		const now = new Date();
		const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);
		await sendWarningNotification("testuser", 3 * 3600, "3h 0m", fifteenMinutesAgo);
		console.log("   ✅ Notification d'alerte envoyée\n");
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// Test 4: Notification de succès
		console.log("4️⃣  Test notification de succès...");
		await sendSuccessNotification("testuser", "7h 30m");
		console.log("   ✅ Notification de succès envoyée\n");

		console.log("✅ Tous les tests sont terminés !");
		console.log("📱 Vérifiez votre téléphone pour voir les notifications.");
	} catch (error) {
		console.error("❌ Erreur lors des tests:", error.message);
		process.exit(1);
	}
}

testNotifications();



