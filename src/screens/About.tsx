import './About.css'

export function About() {
  return (
    <div className="page about">
      <div className="page__head">
        <p className="eyebrow">About</p>
        <h1>How to use this catalog</h1>
      </div>

      <p className="about__lead">
        This is the English Department&rsquo;s book &amp; materials catalog, a digital list of
        everything in the office and a map of where each item lives on the shelves.
        Anyone can search and browse. A teacher signs in to add or change items.
      </p>

      <section className="about__section">
        <h2>The screens</h2>
        <ul className="about__list">
          <li><strong>Catalog</strong>: search and filter every title. Tap a row to see details. This is also where you add new items.</li>
          <li><strong>Add item</strong>: opens from the &ldquo;&#xFF0B; Add item&rdquo; button (top bar, the Catalog page, or the round button on phones). Type a title, set the quantity, tap a category, and save. &ldquo;Save &amp; add another&rdquo; keeps the category and location so you can rattle through a stack of books quickly.</li>
          <li><strong>Shelves</strong>: browse the collection by physical location, matching the colored shelf labels.</li>
          <li><strong>Labels</strong>: print shelf and category labels that match the catalog&rsquo;s colors.</li>
          <li><strong>Review</strong>: a cleanup list of items that need a category, look like duplicates, or are missing a quantity.</li>
          <li><strong>Export</strong>: download the whole catalog as a CSV backup.</li>
        </ul>
      </section>

      <section className="about__section">
        <h2>Viewing vs. editing</h2>
        <p>
          Without signing in, the site is read-only, perfect for teachers who just want to
          find a book. The department&rsquo;s account signs in to add, edit, and clean up; those
          changes appear for everyone right away.
        </p>
      </section>

      <section className="about__section">
        <h2>Keep a backup</h2>
        <p>
          Export the catalog every so often. Even if a login is shared by accident, an
          exported CSV keeps your data safe and restorable.
        </p>
      </section>

      <div className="credit about__credit">
        <span className="credit__name">Made by William Yin</span>
        <span className="credit__class">Graduating Class of 2027 at Victoria Park CI</span>
        <span className="credit__commission">
          Commissioned by Mrs. Yulien, whose idea for a department catalog got it started. Thank you.
        </span>
        <a className="credit__email" href="mailto:william.xhyin@gmail.com">
          william.xhyin@gmail.com
        </a>
      </div>
    </div>
  )
}
