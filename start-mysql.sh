#!/bin/bash

echo "🔍 Checking MySQL status..."

# Check if MySQL is already running
if ps aux | grep -v grep | grep mysql > /dev/null; then
    echo "✅ MySQL is already running!"
    ps aux | grep -v grep | grep mysql | head -2
    exit 0
fi

echo "⚠️  MySQL is not running. Attempting to start..."
echo ""
echo "Please choose an option:"
echo "1. Start with sudo (requires password)"
echo "2. Open XAMPP Manager manually"
echo "3. Exit"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "Starting MySQL with sudo..."
        sudo /Applications/XAMPP/xamppfiles/bin/mysql.server start
        ;;
    2)
        echo "Please open XAMPP Manager and start MySQL manually"
        open /Applications/XAMPP/manager-osx.app 2>/dev/null || echo "XAMPP Manager not found at default location"
        ;;
    3)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

# Verify MySQL started
sleep 2
if ps aux | grep -v grep | grep mysql > /dev/null; then
    echo "✅ MySQL started successfully!"
else
    echo "❌ Failed to start MySQL. Please start it manually from XAMPP Manager."
fi
