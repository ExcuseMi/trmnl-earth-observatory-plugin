// node --test plugin/test : the transform must never throw on an answer that is not a list of posts
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const file = process.env.TRANSFORM || path.join(__dirname, '..', 'src', 'transform.js');
const transform = new Function(fs.readFileSync(file, 'utf8') + '\nreturn transform;')();

const post = {
  title: { rendered: 'A &amp; B' }, link: 'https://example.org/p', date_gmt: '2026-10-13T04:01:00',
  excerpt: { rendered: '<p>Text</p>' },
  _embedded: { 'wp:featuredmedia': [{ source_url: 'https://example.org/a.jpg', mime_type: 'image/jpeg' }] },
};

test('a list of posts, bare or under data', () => {
  assert.strictEqual(transform([post]).image.title, 'A & B');
  assert.strictEqual(transform({ data: [post] }).image.image_url, 'https://example.org/a.jpg?w=1440&h=1260&fit=clip');
});

for (const [name, input] of [
  ['an API error object', { code: 'rest_error', message: 'x', data: { status: 429 } }],
  ['an error page as text', { data: '<html>blocked</html>' }],
  ['a wrapped error object', { data: { code: 'rest_error', data: { status: 500 } } }],
  ['nothing', undefined],
  ['an empty object', {}],
]) {
  test(`no crash on ${name}`, () => {
    const out = transform(input);
    assert.strictEqual(out.image, null);
    assert.ok(out.notice);
  });
}

test('an empty list is no image, without a notice', () => {
  assert.deepStrictEqual(transform({ data: [] }), { image: null });
});
