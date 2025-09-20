#!/usr/bin/env node

/**
 * Background service for running the event indexer
 * This can be deployed as a separate service or run as a background process
 */

import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'

const indexerPath = path.join(__dirname, 'indexer.ts')
const logDir = path.join(process.cwd(), 'logs')
const logFile = path.join(logDir, 'indexer.log')
const pidFile = path.join(logDir, 'indexer.pid')

// Ensure log directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true })
}

class IndexerService {
  private process: any = null
  private restartCount = 0
  private maxRestarts = 10
  private restartDelay = 5000

  start() {
    console.log('🚀 Starting NFT Marketplace Indexer Service...')
    
    // Check if already running
    if (this.isRunning()) {
      console.log('⚠️  Indexer is already running')
      return
    }

    this.spawnIndexer()
  }

  stop() {
    console.log('🛑 Stopping NFT Marketplace Indexer Service...')
    
    if (this.process) {
      this.process.kill('SIGTERM')
      this.process = null
    }

    // Remove PID file
    if (fs.existsSync(pidFile)) {
      fs.unlinkSync(pidFile)
    }

    console.log('✅ Indexer service stopped')
  }

  restart() {
    console.log('🔄 Restarting NFT Marketplace Indexer Service...')
    this.stop()
    
    setTimeout(() => {
      this.start()
    }, 2000)
  }

  status() {
    if (this.isRunning()) {
      const pid = fs.readFileSync(pidFile, 'utf8')
      console.log(`✅ Indexer is running (PID: ${pid})`)
      
      // Show log tail
      if (fs.existsSync(logFile)) {
        const logs = fs.readFileSync(logFile, 'utf8').split('\n').slice(-5).join('\n')
        console.log('\n📄 Recent logs:')
        console.log(logs)
      }
    } else {
      console.log('❌ Indexer is not running')
    }
  }

  private spawnIndexer() {
    console.log(`📍 Starting indexer process...`)
    
    // Spawn the indexer process
    this.process = spawn('npx', ['tsx', indexerPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      env: {
        ...process.env,
        NODE_ENV: process.env.NODE_ENV || 'development'
      }
    })

    // Write PID file
    fs.writeFileSync(pidFile, this.process.pid.toString())

    // Set up logging
    const logStream = fs.createWriteStream(logFile, { flags: 'a' })
    
    this.process.stdout.on('data', (data: Buffer) => {
      const message = data.toString()
      console.log(message.trim())
      logStream.write(`[${new Date().toISOString()}] ${message}`)
    })

    this.process.stderr.on('data', (data: Buffer) => {
      const message = data.toString()
      console.error(message.trim())
      logStream.write(`[${new Date().toISOString()}] ERROR: ${message}`)
    })

    this.process.on('close', (code: number) => {
      logStream.end()
      
      if (code !== 0) {
        console.error(`❌ Indexer process exited with code ${code}`)
        
        // Auto-restart if not too many failures
        if (this.restartCount < this.maxRestarts) {
          this.restartCount++
          console.log(`🔄 Restarting indexer (attempt ${this.restartCount}/${this.maxRestarts})...`)
          
          setTimeout(() => {
            this.spawnIndexer()
          }, this.restartDelay)
        } else {
          console.error(`💥 Max restart attempts reached. Manual intervention required.`)
        }
      } else {
        console.log('✅ Indexer process exited cleanly')
      }

      // Remove PID file
      if (fs.existsSync(pidFile)) {
        fs.unlinkSync(pidFile)
      }
    })

    this.process.on('error', (error: Error) => {
      console.error('💥 Failed to start indexer process:', error)
      logStream.write(`[${new Date().toISOString()}] FATAL: ${error.message}\n`)
      logStream.end()
    })

    console.log(`✅ Indexer started with PID: ${this.process.pid}`)
  }

  private isRunning(): boolean {
    if (!fs.existsSync(pidFile)) {
      return false
    }

    try {
      const pid = parseInt(fs.readFileSync(pidFile, 'utf8'))
      process.kill(pid, 0) // Check if process exists
      return true
    } catch (error) {
      // Process doesn't exist, clean up PID file
      fs.unlinkSync(pidFile)
      return false
    }
  }
}

// Handle command line arguments
const command = process.argv[2]
const service = new IndexerService()

switch (command) {
  case 'start':
    service.start()
    break
  
  case 'stop':
    service.stop()
    break
  
  case 'restart':
    service.restart()
    break
  
  case 'status':
    service.status()
    break
  
  default:
    console.log(`
🔧 NFT Marketplace Indexer Service

Usage:
  npm run indexer:start   - Start the indexer service
  npm run indexer:stop    - Stop the indexer service  
  npm run indexer:restart - Restart the indexer service
  npm run indexer:status  - Check indexer status

Commands:
  node scripts/service.js start    - Start service
  node scripts/service.js stop     - Stop service
  node scripts/service.js restart  - Restart service
  node scripts/service.js status   - Show status
`)
    break
}

// Handle shutdown signals
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down...')
  service.stop()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...')
  service.stop()
  process.exit(0)
})