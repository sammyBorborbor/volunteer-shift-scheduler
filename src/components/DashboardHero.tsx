interface DashboardHeroProps {
  imageUrl: string
  imageAlt: string
  title: string
  subtitle: string
}

// Full-bleed banner between the header and the max-w-5xl content column —
// the only place in the product-register app that earns a "Committed"
// color surface (per the design system's product/brand distinction): a
// single welcoming entry point per dashboard, not decoration repeated
// across every screen. Photo is real, sourced and verified the same way as
// the landing page's brand-register hero, not a stock-cliché placeholder.
export function DashboardHero({ imageUrl, imageAlt, title, subtitle }: DashboardHeroProps) {
  return (
    <section className="relative h-48 w-full overflow-hidden bg-ink sm:h-56 md:h-64">
      <img
        src={imageUrl}
        alt={imageAlt}
        loading="eager"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/95 via-ink/75 to-ink/25" />
      <div className="relative mx-auto flex h-full max-w-5xl flex-col justify-center px-4">
        <h2 className="max-w-md text-balance text-2xl font-semibold text-ink-foreground sm:text-3xl">
          {title}
        </h2>
        <p className="mt-2 max-w-sm text-sm text-ink-foreground/85 sm:text-base">{subtitle}</p>
      </div>
    </section>
  )
}
