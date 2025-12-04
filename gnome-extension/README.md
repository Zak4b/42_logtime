# Extension GNOME - 42 Logtime Display

Extension GNOME Shell qui affiche votre temps de log 42 dans la barre supérieure.

## Fonctionnalités

### Affichage du temps
- **Mode Logtime** (par défaut) : Affiche le temps total de présence aujourd'hui au format `XXh YYm ZZs`
- **Mode Temps restant** : Affiche le temps restant avant d'atteindre les 7 heures requises
- Mise à jour en temps réel chaque seconde
- Indicateur de pause avec ⏸️ et durée de la pause

### Options configurables (menu déroulant)

1. **Afficher le temps restant**
   - Active/désactive le mode "temps restant"
   - Quand activé : affiche "Reste: XXh YYm ZZs"
   - Quand les 7h sont atteintes : affiche "✓ 7h atteint"

2. **Afficher l'heure de départ**
   - Calcule et affiche l'heure estimée à laquelle vous pourrez partir (après 7h)
   - Format : "| Départ: HH:MM:SS"
   - Quand les 7h sont déjà atteintes : affiche "| ✓ Peut partir"

### Exemples d'affichage

```
Mode Logtime simple :
05h 23m 45s

Mode Logtime avec pause :
05h 23m 45s ⏸️ 00h 12m 30s

Mode Temps restant :
Reste: 01h 36m 15s

Avec heure de départ :
05h 23m 45s | Départ: 18:15:30

7h atteintes :
✓ 7h atteint | ✓ Peut partir
```

## Installation

### Prérequis
- GNOME Shell 42, 43, 44, 45 ou 46
- Le serveur 42_logtime doit être en cours d'exécution sur `http://localhost:9655`

### Installation automatique

```bash
./install.sh
```

Puis rechargez GNOME Shell :
- Appuyez sur `Alt+F2`
- Tapez `r` et appuyez sur `Entrée`
- Ou déconnectez-vous et reconnectez-vous (pour Wayland)

Activez l'extension :
```bash
gnome-extensions enable 42-logtime@local
```

### Installation manuelle

1. Copiez les fichiers dans le dossier des extensions :
```bash
mkdir -p ~/.local/share/gnome-shell/extensions/42-logtime@local
cp -r * ~/.local/share/gnome-shell/extensions/42-logtime@local/
```

2. Compilez les schémas GSettings :
```bash
glib-compile-schemas ~/.local/share/gnome-shell/extensions/42-logtime@local/schemas/
```

3. Rechargez GNOME Shell et activez l'extension

## Configuration

Cliquez sur l'indicateur dans la barre supérieure pour accéder aux options :

- **Afficher le temps restant** : Bascule entre l'affichage du temps de log et du temps restant
- **Afficher l'heure de départ** : Affiche l'heure estimée de départ (compatible avec les deux modes)

Les paramètres sont sauvegardés automatiquement et persistent après un redémarrage.

## Architecture

```
42-logtime@local/
├── extension.js          # Point d'entrée principal de l'extension
├── metadata.json         # Métadonnées de l'extension
├── modules/
│   ├── api.js           # Gestion des requêtes HTTP (Soup)
│   ├── display.js       # Logique d'affichage et formatage
│   ├── menu.js          # Création et gestion du menu popup
│   └── utils.js         # Fonctions utilitaires (calculs de temps)
└── schemas/
    └── org.gnome.shell.extensions.42-logtime.gschema.xml
```

## Dépendances

- `gi://St` - Widgets de la Shell Toolkit
- `gi://GLib` - Fonctions système et timers
- `gi://Clutter` - Gestion de l'affichage
- `gi://Soup?version=3.0` - Client HTTP

## Désinstallation

```bash
gnome-extensions disable 42-logtime@local
rm -rf ~/.local/share/gnome-shell/extensions/42-logtime@local
```

## Dépannage

### L'extension ne s'affiche pas
1. Vérifiez que le serveur est lancé : `curl http://localhost:9655`
2. Rechargez GNOME Shell : `Alt+F2` → `r`
3. Vérifiez les logs : `journalctl -f -o cat /usr/bin/gnome-shell`

### Affiche "Err: Connexion"
Le serveur 42_logtime n'est pas accessible. Vérifiez qu'il est bien démarré.

### Les paramètres ne se sauvegardent pas
Vérifiez que les schémas sont compilés :
```bash
glib-compile-schemas ~/.local/share/gnome-shell/extensions/42-logtime@local/schemas/
```

## Licence

Ce projet est sous licence libre pour usage personnel et éducatif.
