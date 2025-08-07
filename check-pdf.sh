#!/bin/bash

# PDF File Status Checker for BHEM Website
echo "📄 BHEM Website PDF File Status Checker"
echo "======================================"

# Check current PDF files in public directory
echo "🔍 Scanning public directory for PDF files..."
pdf_files=$(find public -name "*.pdf" 2>/dev/null)

if [ -z "$pdf_files" ]; then
    echo "❌ No PDF files found in public directory!"
    exit 1
fi

echo "📋 Found PDF files:"
for pdf in $pdf_files; do
    size=$(ls -lh "$pdf" | awk '{print $5}')
    date=$(ls -l "$pdf" | awk '{print $6, $7, $8}')
    echo "   📄 $pdf ($size, modified: $date)"
done

echo ""
echo "🔍 Checking git status..."

# Check if PDF files are tracked by git
echo ""
echo "📊 Git Status:"
tracked_pdfs=""
untracked_pdfs=""
modified_pdfs=""

for pdf in $pdf_files; do
    if git ls-files --error-unmatch "$pdf" >/dev/null 2>&1; then
        # File is tracked
        if git diff --name-only | grep -q "^$pdf$"; then
            modified_pdfs="$modified_pdfs$pdf\n"
        else
            tracked_pdfs="$tracked_pdfs$pdf\n"
        fi
    else
        # File is untracked
        untracked_pdfs="$untracked_pdfs$pdf\n"
    fi
done

if [ -n "$tracked_pdfs" ]; then
    echo "✅ Tracked and up-to-date:"
    echo -e "$tracked_pdfs" | grep -v '^$' | sed 's/^/   /'
fi

if [ -n "$modified_pdfs" ]; then
    echo "⚠️  Modified (not staged):"
    echo -e "$modified_pdfs" | grep -v '^$' | sed 's/^/   /'
fi

if [ -n "$untracked_pdfs" ]; then
    echo "❌ Untracked:"
    echo -e "$untracked_pdfs" | grep -v '^$' | sed 's/^/   /'
    echo ""
    echo "💡 To add untracked PDF files:"
    echo "   git add public/*.pdf"
fi

echo ""
echo "🚀 To commit PDF changes:"
echo "   git add public/*.pdf"
echo "   git commit -m 'Update PDF files'"
echo "   git push origin main"
echo "   git push origin BHEM-website-v0"