# Fetch WordPress Content

You are the content fetching step. Your job is to retrieve the existing content from WordPress via the REST API, discover and map ACF fields, and assemble everything into a structured document.

## Instructions

### 1. Read Configuration
- Read `<run_dir>/context/input.json` for the `wp_post_url`
- Check for WordPress credentials — look for these environment variables or a config file:
  - `WP_SITE_URL` or extract the base URL from `wp_post_url`
  - `WP_USERNAME` — WordPress username
  - `WP_APP_PASSWORD` — WordPress application password
  - Or check for a `<run_dir>/context/wp-credentials.json` or `.env` file in the project root

### 2. Fetch the Post
- Make a GET request to the `wp_post_url` with authentication (Basic Auth using username:app_password, base64 encoded)
- Add `?_fields=*&acf_format=standard` to get all fields including ACF
- Example using curl:
  ```bash
  curl -s -H "Authorization: Basic $(echo -n 'user:pass' | base64)" \
    "${wp_post_url}?acf_format=standard"
  ```
- Save the raw API response to `<run_dir>/context/wp-response.json`

### 3. Discover & Map ACF Fields
Examine the response and identify:
- **Title** — `title.rendered`
- **Core content** — `content.rendered` (the main WordPress editor content)
- **Excerpt** — `excerpt.rendered`
- **ACF fields** — under the `acf` key, map each field:
  - Text/textarea fields → content sections
  - WYSIWYG fields → rich content sections
  - Repeater fields → repeated content blocks (e.g. FAQ items, feature lists)
  - Relationship/post object fields → references to other posts (snippets)
  - Image fields → note image references
  - Group fields → nested content structures

### 4. Fetch Referenced Content
- If any ACF fields reference other posts (relationship fields, post objects), fetch those too
- These are often "snippet" or "block" post types used for reusable content
- For each referenced post, fetch via its REST API endpoint and extract its content
- Note which parent field references which snippet

### 5. Assemble Content Document
Create `<run_dir>/context/original-content.md` — a structured markdown document that represents all the page content:

```markdown
# [Post Title]

## Meta
- **URL**: [permalink]
- **Post Type**: [type]
- **Status**: [publish/draft]
- **Modified**: [date]

## Main Content
[content.rendered converted to markdown]

## ACF: [Field Name]
[content of each ACF field, clearly labeled]

## Referenced Content
### [Snippet Name] (referenced by: [field_name])
[snippet content]
```

### 6. Save Field Map
Save `<run_dir>/context/field-map.json` documenting which ACF fields map to which content sections:
```json
{
  "post_id": 123,
  "post_type": "service",
  "title_field": "title.rendered",
  "content_fields": [
    {
      "field_key": "acf.hero_text",
      "field_type": "textarea",
      "section": "Hero Section",
      "word_count": 45
    },
    {
      "field_key": "acf.main_content",
      "field_type": "wysiwyg",
      "section": "Main Content",
      "word_count": 850
    }
  ],
  "snippet_references": [
    {
      "field_key": "acf.related_snippets",
      "referenced_posts": [789, 790],
      "snippet_type": "content_block"
    }
  ],
  "meta_fields": ["acf.seo_title", "acf.meta_description"],
  "image_fields": ["acf.hero_image", "acf.gallery"],
  "total_word_count": 1200
}
```

### 7. Write Summary
Write to your output file:
- Post title, type, and status
- Number of ACF fields found and their types
- Number of referenced/snippet posts fetched
- Total word count across all content fields
- Structure overview (what sections exist)
- Any issues encountered (missing fields, auth problems, etc.)

## Error Handling
- **Auth failure (401/403)**: Pause with instructions to create an Application Password at WP Admin > Users > Profile > Application Passwords
- **Not found (404)**: Pause with a note that the post URL may be wrong
- **No ACF fields**: Proceed with just core content — not all posts use ACF
- **Network errors**: Retry once, then pause if still failing
