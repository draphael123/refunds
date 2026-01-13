# Refund Calculator Enhancement Plan

This document outlines all the enhancements being implemented based on user requirements.

## Features to Implement (All except Email)

### High Priority ✅
1. **Editable Medication Calculations** - Allow editing weeks received and remove buttons
2. **Export Functionality** - CSV and PDF export  
3. **Enhanced Medication Filtering** - Filter by pharmacy, category, payment term with sorting
4. **COGS Profit Margin Analysis** - Calculate and display profit margins

### Medium Priority ✅
5. **Bulk Calculations** - Import CSV/Excel and batch processing
6. **Comparison Mode** - Compare multiple calculations side-by-side
7. **Enhanced Statistics** - Charts/graphs for visualization
8. **Better Data Management** - Undo/redo, search, delete items, edit templates

### Nice to Have ✅
9. **Print Functionality** - Print-friendly views
10. **Advanced Calculations** - Additional calculation scenarios
11. **UI/UX Improvements** - Keyboard shortcuts, validation, loading states, toast notifications
12. **Data Persistence** - Backup/restore, export/import

## Implementation Status

- ✅ Utility functions created (export.ts, undo-redo.ts)
- ✅ Chart library installed (recharts)
- ✅ Profit margin functions added to utils.ts
- 🔄 Enhanced page component (in progress)

