# AA Renderer Service Specification

External Remotion-based Node.js service for rendering AA Studio videos.

## Environment Variables

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
SUPABASE_VIDEOS_BUCKET=aa-videos
RENDER_SECRET=<shared_secret>
PORT=3000
```

## Endpoint: POST /render

**Headers:** `Authorization: Bearer ${RENDER_SECRET}`

**Request Body:**
```json
{
  "render_id": "uuid",
  "user_id": "uuid",
  "plan_json": {
    "style": "AA",
    "format": { "w": 1080, "h": 1920, "fps": 30 },
    "brand": { "bg": "#0B0F19", "primary": "#6A00F4", "secondary": "#9D4BFF", "soft": "#EBD7FF" },
    "meta": { "title": "...", "target_duration_sec": 60 },
    "scenes": [...]
  }
}
```

**Response (success):** `{ "ok": true, "video_url": "...", "renderer_job_id": "..." }`

**Response (error):** `{ "ok": false, "error": "..." }`

## Implementation Steps

1. Validate Authorization header matches RENDER_SECRET
2. Validate plan_json (allowed scenes, AA colors, duration 55-65s)
3. Render MP4 using Remotion `renderMedia()` with AAReel composition
4. Upload to Supabase Storage: `${user_id}/${render_id}.mp4`
5. Update aa_video_renders row: status=done, video_url
6. Return success response

## Remotion Composition: AAReel

Scene templates to implement:
- hook, ruleChips, method, angleCard, proofGrid
- threeStep, objectionBubbles, offerStack, testDashboard, winnerLoop

Output: 1080x1920 MP4 @ 30fps with AA brand styling.
