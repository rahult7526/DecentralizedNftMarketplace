import { NextRequest, NextResponse } from 'next/server'
import { DatabaseService } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const stats = await DatabaseService.getMarketplaceStats()
    
    return NextResponse.json({
      success: true,
      data: stats
    })
    
  } catch (error) {
    console.error('Error fetching marketplace stats:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch marketplace statistics',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}