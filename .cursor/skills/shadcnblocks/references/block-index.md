# Block Index — Tagged Picks for Intelligent Selection

> Curated, tagged subset of blocks for the highest-traffic sections. Used to narrow hundreds of options to 2-3 best-fit recommendations via 0-2 questions.

For the full untagged catalog, see `block-catalog.md`.

## How This Works

1. Infer constraints from the user request (section, goal, layout hints).
2. If ambiguity remains, ask 1-2 targeted questions using `selection_prompts`.
3. Map answers to tag filters.
4. Return 2-3 best picks with reasoning.

## Tag Vocabulary

```yaml
layout:
  - centered
  - split_left_media
  - split_right_media
  - grid_cards
  - grid_icons
  - bento
  - alternating
  - stacked
  - full_bleed
  - comparison_table
  - sidebar
  - multi_column
  - carousel
  - timeline
  - masonry

content_density:
  - minimal
  - standard
  - rich

tone:
  - minimal
  - modern
  - bold
  - playful
  - enterprise
  - elegant

goal:
  - awareness
  - explain
  - trust
  - convert
  - capture_leads
  - compare
  - navigate
  - support

cta_pattern:
  - none
  - single_primary
  - primary_secondary
  - form_capture
  - multi_action
  - link_list

media:
  - none
  - screenshot
  - illustration
  - photo
  - video
  - icons
  - logos
  - avatars
  - chart

interaction:
  - static
  - accordion
  - tabs
  - carousel
  - toggle
  - hover
  - filters
```

## Selection Prompts

```yaml
selection_prompts:
  hero:
    question: "What style of hero section fits your page?"
    options:
      - label: "Centered headline with CTA buttons"
        tags: { layout: [centered], cta_pattern: [single_primary, primary_secondary] }
      - label: "Split layout with product screenshot"
        tags: { layout: [split_left_media, split_right_media], media: [screenshot] }
      - label: "Hero with email/lead capture form"
        tags: { cta_pattern: [form_capture] }
      - label: "Bold visual with background image or video"
        tags: { layout: [full_bleed], media: [photo, video] }

  feature:
    question: "How do you want to showcase your features?"
    options:
      - label: "Card grid"
        tags: { layout: [grid_cards, grid_icons] }
      - label: "Alternating image + text rows"
        tags: { layout: [alternating, split_left_media, split_right_media] }
      - label: "Bento / asymmetric grid"
        tags: { layout: [bento], tone: [modern, bold] }
      - label: "Simple icon list"
        tags: { layout: [grid_icons, stacked], content_density: [minimal, standard] }

  pricing:
    question: "What pricing layout works best?"
    options:
      - label: "Pricing cards"
        tags: { layout: [grid_cards] }
      - label: "Comparison table"
        tags: { layout: [comparison_table] }
      - label: "Toggle monthly/annual"
        tags: { interaction: [toggle] }

  testimonial:
    question: "What type of social proof do you need?"
    options:
      - label: "Quote cards grid"
        tags: { layout: [grid_cards], media: [avatars] }
      - label: "Featured single quote"
        tags: { layout: [centered], content_density: [minimal] }
      - label: "Scrollable carousel"
        tags: { layout: [carousel], interaction: [carousel] }
```

## Curated Block Entries

```yaml
hero_blocks:
  - id: hero1
    why: "Classic 2-column hero with dual CTAs"
    layout: [split_right_media]
    tone: [modern]
    goal: [awareness, convert]
    cta_pattern: primary_secondary
    media: [screenshot]
    complexity: low
  - id: hero30
    why: "Centered hero with lead-capture form"
    layout: [centered]
    tone: [modern]
    goal: [capture_leads, convert]
    cta_pattern: form_capture
    media: [none]
    complexity: medium
  - id: hero125
    why: "Modern centered hero with gradient accents"
    layout: [centered]
    tone: [modern, bold]
    goal: [awareness, convert]
    cta_pattern: primary_secondary
    media: [screenshot]
    complexity: low

feature_blocks:
  - id: feature3
    why: "3-column card grid with icons and descriptions"
    layout: [grid_cards]
    tone: [modern]
    goal: [explain]
    cta_pattern: link_list
    media: [icons]
    complexity: low
  - id: feature14
    why: "Alternating rows with screenshots and checklists"
    layout: [alternating]
    tone: [enterprise, modern]
    goal: [explain]
    media: [screenshot]
    complexity: medium
  - id: feature42
    why: "Tabbed feature explorer"
    layout: [stacked]
    tone: [modern]
    goal: [explain]
    interaction: [tabs]
    complexity: high

pricing_blocks:
  - id: pricing3
    why: "3-tier pricing cards with highlighted plan"
    layout: [grid_cards]
    tone: [modern]
    goal: [compare, convert]
    cta_pattern: single_primary
    complexity: low
  - id: pricing8
    why: "Pricing with monthly/annual toggle"
    layout: [grid_cards]
    tone: [modern]
    goal: [compare, convert]
    interaction: [toggle]
    complexity: medium
  - id: pricing11
    why: "Detailed comparison table"
    layout: [comparison_table]
    tone: [enterprise]
    goal: [compare, convert]
    complexity: medium
```

## Fallback Behavior

For sections not covered in this index:
1. Use defaults from `block-catalog.md`.
2. Ask the user about layout preference.
3. Offer the explorer for full browsing: https://shadcnblocks.com/explorer/blocks
