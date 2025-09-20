'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'

interface CountdownTimerProps {
  endTime: number // Unix timestamp in seconds
  onEnd?: () => void
  className?: string
}

export function CountdownTimer({ endTime, onEnd, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    total: 0
  })

  useEffect(() => {
    const updateTimer = () => {
      const now = Math.floor(Date.now() / 1000)
      const difference = endTime - now

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 })
        onEnd?.()
        return
      }

      const days = Math.floor(difference / (24 * 60 * 60))
      const hours = Math.floor((difference % (24 * 60 * 60)) / (60 * 60))
      const minutes = Math.floor((difference % (60 * 60)) / 60)
      const seconds = difference % 60

      setTimeLeft({ days, hours, minutes, seconds, total: difference })
    }

    // Update immediately
    updateTimer()

    // Update every second
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [endTime, onEnd])

  const formatTime = () => {
    if (timeLeft.total <= 0) {
      return 'Auction Ended'
    }

    if (timeLeft.days > 0) {
      return `${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`
    }

    if (timeLeft.hours > 0) {
      return `${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s`
    }

    if (timeLeft.minutes > 0) {
      return `${timeLeft.minutes}m ${timeLeft.seconds}s`
    }

    return `${timeLeft.seconds}s`
  }

  const getTimeColor = () => {
    if (timeLeft.total <= 0) return 'text-red-600'
    if (timeLeft.total < 300) return 'text-red-500' // Less than 5 minutes
    if (timeLeft.total < 3600) return 'text-orange-500' // Less than 1 hour
    return 'text-muted-foreground'
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Clock className={`w-4 h-4 ${getTimeColor()}`} />
      <span className={`font-medium ${getTimeColor()}`}>
        {formatTime()}
      </span>
    </div>
  )
}