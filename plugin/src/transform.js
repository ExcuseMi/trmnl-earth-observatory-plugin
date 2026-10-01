/**
 * Source: NASA Science WordPress API, category 2151 (Earth Observatory), with the
 * featured image embedded. The old RSS feed now redirects to a feed with malformed XML.
 */

/**
 * Strip HTML tags and collapse whitespace.
 */
function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Decode common HTML entities (WordPress renders titles and excerpts with entities).
 */
function decodeEntities(text) {
  if (!text) return text;
  return text
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

/**
 * Clean the excerpt: strip HTML and remove the "appeared first on" boilerplate.
 */
function cleanDescription(html) {
  if (!html) return null;
  let text = decodeEntities(stripHtml(html));
  text = text.replace(/\s*The post\s+.+?\s+appeared first on\s+.+?\.?\s*$/, '').trim();
  return text || null;
}

/**
 * Featured image URL, sized for e-ink. Skips videos and other non-image media.
 */
function imageUrl(media) {
  if (!media?.source_url) return null;
  if (media.mime_type && !media.mime_type.startsWith('image/')) return null;
  return encodeURI(media.source_url) + '?w=1440&h=1260&fit=clip';
}

/**
 * Image credit "NASA Earth Observatory/Michala Garrison" -> "Michala Garrison".
 */
function author(media) {
  const credit = media?.nasa_hds_core_meta_image_credit || media?.credits || '';
  const name = credit.split('/').pop().trim();
  return name || null;
}

function transform(input) {
  const posts = Array.isArray(input) ? input : (input?.data || []);
  const items = posts
    .map(p => ({ post: p, media: p?._embedded?.['wp:featuredmedia']?.[0] }))
    .filter(i => imageUrl(i.media));
  if (items.length === 0) return { image: null };

  const mode = input?.trmnl?.plugin_settings?.custom_fields_values?.mode || 'latest';
  const { post, media } = mode === 'random'
    ? items[Date.now() % items.length]
    : items[0]; // API is ordered newest-first

  return {
    image: {
      title:       decodeEntities(post.title?.rendered) || null,
      link:        post.link || null,
      pub_date:    post.date_gmt ? new Date(post.date_gmt + 'Z').toUTCString() : null,
      author:      author(media),
      description: cleanDescription(post.excerpt?.rendered),
      image_url:   imageUrl(media),
    }
  };
}
