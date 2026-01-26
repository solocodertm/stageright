#!/bin/bash

# Quick Local Testing Script
# This script helps you test the country routing implementation locally

echo "🚀 Starting Local Testing Setup..."
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚠️  .env.local not found!"
    echo "Creating .env.local from template..."
    cat > .env.local << EOF
# API Configuration
NEXT_PUBLIC_API_URL=https://stageleft.vidaki.com/api
NEXT_PUBLIC_END_POINT=/

# Website URL
NEXT_PUBLIC_WEB_URL=http://localhost:3000

# Meta Tags
NEXT_PUBLIC_META_TITLE=Vidaki Classifieds
NEXT_PUBLIC_META_DESCRIPTION=Find and list classified ads
NEXT_PUBLIC_META_kEYWORDS=classifieds,ads,marketplace

# Default Country
NEXT_PUBLIC_DEFAULT_COUNTRY=US

# Web Version
NEXT_PUBLIC_WEB_VERSION=1.0.0
EOF
    echo "✅ Created .env.local"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "📦 Checking dependencies..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi

echo ""
echo "🧪 Testing Checklist:"
echo ""
echo "1. Start dev server:"
echo "   npm run dev"
echo ""
echo "2. Open browser: http://localhost:3000"
echo ""
echo "3. Test these URLs:"
echo "   - http://localhost:3000/          (should redirect to /us or detected country)"
echo "   - http://localhost:3000/us         (US home page)"
echo "   - http://localhost:3000/gb         (UK home page)"
echo "   - http://localhost:3000/de         (Germany home page)"
echo ""
echo "4. Test country switcher in header"
echo "5. Test language switcher (should NOT change URL)"
echo "6. Check browser console for errors"
echo "7. Check Network tab - API calls should include 'country' parameter"
echo ""
echo "📖 For detailed testing guide, see: LOCAL_TESTING_GUIDE.md"
echo ""
echo "Ready to test! Run: npm run dev"



