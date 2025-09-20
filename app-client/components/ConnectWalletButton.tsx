'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export function ConnectWalletButton() {
  return (
    <ConnectButton
      chainStatus="icon"
      accountStatus={{
        smallScreen: 'avatar',
        largeScreen: 'full',
      }}
      showBalance={{
        smallScreen: false,
        largeScreen: true,
      }}
    />
  )
}
