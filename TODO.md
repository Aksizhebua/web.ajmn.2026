# Tailwind Migration TODO

## Status: 1/14 completed ✅ (index.html: navbar/hero/services/tenants/footer)

### Step 1: Common components migrated to index.html ✓

### Step 2: Page-specific migrations
- [x] index.html (services, tenants carousel) 
- [ ] about.html (profile-section)
- [ ] academic-venture.html (academic-services grid)
- [ ] academic-detail.html
- [ ] contact.html (contact-grid)
- [ ] gallery.html (filter-bar, gallery-grid-5x2)
- [ ] non-academic-venture.html (venue-section, ballroom-detail-section*)
- [ ] past-events.html (whatson-section events)
- [ ] upcoming-events.html (whatson-section events)
- [ ] whats-on.html (combined events)
- [ ] tenant-detail.html (tenant-hero, detail sections)
- [ ] admin/index.html (dashboard, admin-table)

### Step 3: Final cleanup & verification
- [ ] Remove `<link rel="stylesheet" href="style.css">` from remaining files
- [ ] Apply navbar/hero/footer template to all files
- [ ] Test navbar scroll/hamburger/dropdowns
- [ ] Test responsive (mobile/desktop)
- [ ] Test Firebase dynamic content (events/gallery/tenants)
- [ ] Archive style.css
- [ ] Run live-server demo

**Next: Migrate about.html + apply navbar template to all.**
