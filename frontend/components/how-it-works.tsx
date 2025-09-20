const steps = [
  {
    step: 1,
    title: 'Connect Wallet',
    description: 'Connect your crypto wallet to get started with buying and selling NFTs.',
  },
  {
    step: 2,
    title: 'Create or Browse',
    description: 'Upload your digital art to create NFTs or browse our marketplace for unique pieces.',
  },
  {
    step: 3,
    title: 'List for Sale',
    description: 'Set a fixed price or create an auction for your NFTs with zero platform fees.',
  },
  {
    step: 4,
    title: 'Trade & Earn',
    description: 'Buy, sell, and trade NFTs while earning royalties on your creations.',
  },
]

export function HowItWorks() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">How It Works</h2>
          <p className="text-muted-foreground">
            Get started with DeNft Marketplace in just a few simple steps
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.step} className="text-center">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                {step.step}
              </div>
              <h3 className="mb-2 text-xl font-semibold">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

