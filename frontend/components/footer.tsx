import Link from 'next/link'

const footerLinks = {
  Marketplace: [
    { href: '/marketplace', label: 'Browse NFTs' },
    { href: '/mint', label: 'Create NFT' },
    { href: '/auctions', label: 'Auctions' },
  ],
  Resources: [
    { href: '/docs', label: 'Documentation' },
    { href: '/help', label: 'Help Center' },
    { href: '/api', label: 'API' },
  ],
  Community: [
    { href: '/discord', label: 'Discord' },
    { href: '/twitter', label: 'Twitter' },
    { href: '/github', label: 'GitHub' },
  ],
  Legal: [
    { href: '/terms', label: 'Terms of Service' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/cookies', label: 'Cookie Policy' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600" />
              <span className="text-xl font-bold gradient-text">DeNft</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              The decentralized marketplace for in-game assets and digital art.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 font-semibold">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 DeNft Marketplace. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

