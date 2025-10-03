# Fix Stage-Specific Checklists

**Date**: 2025-10-03
**Priority**: HIGH
**Issue**: Checklist items accumulate across stages instead of being stage-specific

## Problem Statement

Current behavior (WRONG):
- Card created in Research → Gets 4 Research template items
- Card moved to Envision → Gets 5 Envision template items ADDED (total: 9 items)
- Result: Checklist shows items from ALL previous stages

Expected behavior (CORRECT):
- Card created in Research → Gets 4 Research template items
- Card moved to Envision → Research templates REPLACED with 5 Envision template items
- Custom items (user-created) persist across stages
- Result: Checklist shows only current stage's templates + custom items

## Root Cause

In `/app/api/cards/[cardId]/move/route.ts` (lines 64-83), the logic:
1. ✅ Detects stage change
2. ✅ Fetches new stage templates
3. ✅ Creates checklist items from templates
4. ❌ **BUT does NOT delete old stage's template items**

## Solution

Modify the move API to:

### Step 1: Delete old template items
```typescript
// Delete template-based items (keep custom items)
await db
  .delete(cardChecklistItems)
  .where(
    and(
      eq(cardChecklistItems.cardId, cardId),
      eq(cardChecklistItems.isCustom, false) // Only delete template items
    )
  )
```

### Step 2: Add new template items
(Existing logic already works)

## Files to Modify

1. `/app/api/cards/[cardId]/move/route.ts` - Add deletion logic before insertion

## Testing Plan

1. Create card in Research stage
2. Verify 4 Research template items exist
3. Add 1 custom item
4. Move card to Envision stage
5. Verify:
   - ✅ 5 Envision template items exist
   - ✅ 1 custom item still exists
   - ✅ 0 Research template items exist
   - ✅ Total: 6 items (5 templates + 1 custom)
6. Test with Playwright

## Business Logic

**Template Items**:
- Stage-specific
- Deleted when moving to new stage
- Cannot be deleted by user manually
- Defined in checklist_templates table

**Custom Items**:
- User-created
- Persist across all stage changes
- Can be deleted by user
- No template_id reference

## Implementation Time

- Code changes: 10 minutes
- Testing: 15 minutes
- **Total: ~25 minutes**

## Status

- [ ] Code changes
- [ ] Manual testing
- [ ] Playwright testing
- [ ] Documentation update
