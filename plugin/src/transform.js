/**
 * Strip HTML tags and collapse whitespace.
 */
function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Clean the RSS description: strip HTML and remove the "appeared first on" boilerplate.
 */
function cleanDescription(html) {
  if (!html) return null;
  let text = stripHtml(html);
  text = text.replace(/\s*The post\s+.+?\s+appeared first on\s+.+?\.?\s*$/, '').trim();
  return text || null;
}

/**
 * Extract the first image src from HTML (content:encoded) and decode HTML entities.
 * TRMNL parses content:encoded into item.encoded (namespace prefix stripped).
 * NASA RSS uses &amp; inside src="" attributes, so decoding is required.
 */
function extractImageUrl(html) {
  if (!html) return null;
  const match = html.match(/src="([^"]+)"/);
  return match ? decodeEntities(match[1]) : null;
}

/**
 * Decode common HTML entities.
 */
function decodeEntities(text) {
  if (!text) return text;
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function transform(input) {
  const channel = input?.rss?.channel;
  if (!channel) return { image: null };

  const raw = channel.item || [];
  const items = Array.isArray(raw) ? raw : [raw];
  if (items.length === 0) return { image: null };

  const mode = input?.trmnl?.plugin_settings?.custom_fields_values?.mode || 'latest';
  const selectedItem = mode === 'random'
    ? items[Date.now() % items.length]
    : items[0]; // RSS is ordered newest-first

  if (!selectedItem) return { image: null };

  const categories = Array.isArray(selectedItem.category)
    ? selectedItem.category
    : [selectedItem.category].filter(Boolean);

  return {
    image: {
      title:       decodeEntities(selectedItem.title) || null,
      link:        selectedItem.link || null,
      pub_date:    selectedItem.pubDate || null,
      author:      selectedItem.creator || null,       // dc:creator → creator
      description: cleanDescription(selectedItem.description),
      image_url:   extractImageUrl(selectedItem.encoded || ''), // content:encoded → encoded
      categories,
    }
  };
}
