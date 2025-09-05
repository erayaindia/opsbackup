# Shot List Field Mapping

## Database Columns → UI Field Mapping

Based on your current `shot_list` table columns, here's how each field maps:

### ✅ **Existing Columns (Already in Database)**
| Database Column | UI Field | Type | Notes |
|----------------|----------|------|--------|
| `id` | shot.id | UUID/String | Auto-generated primary key |
| `content_id` | - | UUID | Foreign key to content_items |
| `shot_number` | - | Integer | Auto-calculated (index + 1) |
| `shot_type` | shot.shot_type | String | Not shown in UI currently |
| `description` | Shot Description | String | Main input field in header |
| `duration` | shot.duration | Number | Not shown in UI currently |
| `location` | Location | String | ✅ **NEW UI FIELD** |
| `equipment` | shot.equipment | String[] | Not shown in UI currently |
| `notes` | shot.notes | String | Not shown in UI currently |
| `status` | shot.status | Enum | Not shown in UI currently |
| `order_index` | shot.order | Integer | Used for drag-reorder |
| `created_at` | - | Timestamp | Auto-managed by DB |
| `updated_at` | - | Timestamp | Auto-managed by DB |
| `action` | Action | String | ✅ **Visible in UI** |
| `camera` | Camera | String | ✅ **Visible in UI** |
| `background` | Background | String | ✅ **Visible in UI** |
| `overlays` | - | String | ❌ **REMOVED from UI** |
| `assignee_id` | shot.assignee_id | UUID | Not shown in UI currently |
| `references` | Reference Images/Links | String[] | ✅ **Visible in UI** |
| `completed` | Completion Checkbox | Boolean | ✅ **Visible in UI** |

### 🆕 **Missing Columns (Need to be Added)**
| Database Column | UI Field | Type | SQL Command |
|----------------|----------|------|-------------|
| `props` | Props (chips) | String[] | ✅ **NEW UI FIELD** |
| `talent` | Talent/Model | String | ✅ **NEW UI FIELD** |
| `lighting_notes` | Lighting Notes | String | ✅ **NEW UI FIELD** |

## SQL to Add Missing Columns

```sql
-- Run this SQL to add the missing columns:
ALTER TABLE shot_list 
ADD COLUMN IF NOT EXISTS props TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
ADD COLUMN IF NOT EXISTS talent TEXT,
ADD COLUMN IF NOT EXISTS lighting_notes TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_shot_list_props ON shot_list USING GIN(props);
CREATE INDEX IF NOT EXISTS idx_shot_list_talent ON shot_list(talent) WHERE talent IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shot_list_lighting_notes ON shot_list(lighting_notes) WHERE lighting_notes IS NOT NULL;
```

## Complete Field Saving Flow

### When a shot is saved, these fields are persisted:

**✅ Currently Saved Fields:**
- `shot_number` → auto-calculated (index + 1)
- `description` → from UI input
- `camera` → from UI input  
- `action` → from UI input
- `background` → from UI textarea
- `location` → from UI input (**NEW**)
- `references` → from UI array
- `completed` → from UI checkbox
- `order_index` → from array position

**🆕 New Fields Being Saved:**
- `props` → from UI chips array (**NEW**)
- `talent` → from UI input (**NEW**)
- `lighting_notes` → from UI textarea (**NEW**)

**📋 Fields Not Currently in UI (but preserved):**
- `shot_type` → empty string
- `duration` → null
- `equipment` → empty array
- `notes` → empty string
- `status` → "planned"
- `overlays` → empty string (backward compatibility)
- `assignee_id` → null

## Data Flow

1. **UI → Database Save:**
   ```typescript
   await ContentService.saveShotList(contentId, shots.map(shot => ({
     shot_number: index + 1,
     shot_type: shot.shot_type || '',
     description: shot.description || '',
     // ... all other fields mapped
     props: shot.props || [],           // NEW
     talent: shot.talent || '',         // NEW  
     lighting_notes: shot.lightingNotes || ''  // NEW
   })))
   ```

2. **Database → UI Load:**
   ```typescript
   shotList: dbShots.map(shot => ({
     id: shot.id,
     description: shot.description || "",
     // ... all other fields mapped
     props: shot.props || [],           // NEW
     talent: shot.talent || "",         // NEW
     lightingNotes: shot.lighting_notes || ""  // NEW
   }))
   ```

## Validation & Constraints

- ✅ **Props**: Array validation, trim whitespace, filter empty strings
- ✅ **Talent**: Optional text field, can be empty
- ✅ **Lighting Notes**: Optional textarea, can be empty  
- ✅ **Location**: Optional text field, can be empty

## Testing Queries

```sql
-- Test insert with new fields
INSERT INTO shot_list (content_id, shot_number, description, location, props, talent, lighting_notes)
VALUES ('your-content-id', 1, 'Test shot', 'studio', ARRAY['prop1', 'prop2'], 'Model', 'Soft lighting');

-- Test select with new fields  
SELECT id, description, location, props, talent, lighting_notes 
FROM shot_list 
WHERE content_id = 'your-content-id';
```