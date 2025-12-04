#!/bin/bash

# Script d'installation pour l'extension GNOME 42 Logtime

EXTENSION_DIR="$HOME/.local/share/gnome-shell/extensions/42-logtime@local"
SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "📦 Installation de l'extension 42 Logtime Display..."

# Créer le répertoire des extensions s'il n'existe pas
mkdir -p "$HOME/.local/share/gnome-shell/extensions"

# Supprimer l'ancienne version si elle existe
if [ -d "$EXTENSION_DIR" ]; then
    echo "🗑️  Suppression de l'ancienne version..."
    rm -rf "$EXTENSION_DIR"
fi

# Créer le répertoire de l'extension
mkdir -p "$EXTENSION_DIR"
mkdir -p "$EXTENSION_DIR/modules"
mkdir -p "$EXTENSION_DIR/schemas"

# Copier les fichiers principaux
echo "📋 Copie des fichiers..."
cp "$SOURCE_DIR/extension.js" "$EXTENSION_DIR/"
cp "$SOURCE_DIR/metadata.json" "$EXTENSION_DIR/"

# Copier les modules
if [ -d "$SOURCE_DIR/modules" ]; then
    cp "$SOURCE_DIR/modules"/*.js "$EXTENSION_DIR/modules/" 2>/dev/null
fi

# Copier et compiler les schémas
if [ -d "$SOURCE_DIR/schemas" ]; then
    cp "$SOURCE_DIR/schemas"/*.xml "$EXTENSION_DIR/schemas/" 2>/dev/null
    echo "🔨 Compilation des schémas GSettings..."
    glib-compile-schemas "$EXTENSION_DIR/schemas/" 2>/dev/null || {
        echo "⚠️  Avertissement: Impossible de compiler les schémas"
    }
fi

# Vérifier que les fichiers essentiels sont présents
if [ ! -f "$EXTENSION_DIR/extension.js" ] || [ ! -f "$EXTENSION_DIR/metadata.json" ]; then
    echo "❌ Erreur: Les fichiers essentiels n'ont pas été copiés correctement"
    echo "   Vérifiez que vous exécutez le script depuis le dossier gnome-extension"
    exit 1
fi

echo "✅ Extension installée dans: $EXTENSION_DIR"
echo ""
echo "📝 Fichiers installés:"
find "$EXTENSION_DIR" -type f \( -name "*.js" -o -name "*.json" -o -name "*.xml" -o -name "*.compiled" \) -printf "   - %P\n" | sort
echo ""
echo "🔄 IMPORTANT: Rechargez GNOME Shell pour que l'extension soit détectée:"
echo "   Appuyez sur Alt+F2, tapez 'r' et appuyez sur Entrée"
echo ""
echo "🔧 Après le rechargement, activez l'extension:"
echo "   1. Ouvrez l'application 'Extensions' (ou 'Extensions GNOME')"
echo "   2. Recherchez '42 Logtime Display'"
echo "   3. Activez l'extension"
echo ""
echo "   Ou via la ligne de commande (après rechargement):"
echo "   gnome-extensions enable 42-logtime@local"
echo ""
echo "⚠️  Assurez-vous que le serveur 42_logtime est démarré:"
echo "   npm run server"


