import { Client, ClientConfig } from 'pg'
import dns from 'dns/promises'

type ConnectionConfig = {
  name: string
  config: ClientConfig
}

async function testConnection(): Promise<boolean> {
  console.log('=== PostgreSQL Connection Test ===\n')

  try {
    const addresses = await dns.resolve4('localhost')
    console.log('✓ localhost resolves to:', addresses)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.log('✗ DNS resolution failed:', message)
  }

  const connections: ConnectionConfig[] = [
    {
      name: 'Trust without password (config object)',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'opus_language',
        user: 'postgres',
      },
    },
    {
      name: 'With postgres password',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'opus_language',
        user: 'postgres',
        password: 'postgres',
      },
    },
    {
      name: 'Using 127.0.0.1 instead of localhost',
      config: {
        host: '127.0.0.1',
        port: 5432,
        database: 'opus_language',
        user: 'postgres',
      },
    },
    {
      name: 'Connection string without password',
      config: {
        connectionString: 'postgresql://postgres@localhost:5432/opus_language',
      },
    },
  ]

  for (const connection of connections) {
    console.log(`\n⏳ Testing: ${connection.name}`)
    console.log('   Config:', JSON.stringify(connection.config, null, 2))

    const client = new Client(connection.config)

    try {
      await client.connect()
      const res = await client.query('SELECT NOW(), current_user, inet_server_addr()')
      console.log('   ✅ SUCCESS!')
      console.log('      Time:', res.rows[0].now)
      console.log('      User:', res.rows[0].current_user)
      console.log('      Server:', res.rows[0].inet_server_addr)

      const tableCheck = await client.query('SELECT COUNT(*) FROM users')
      console.log('      Users table count:', tableCheck.rows[0].count)

      await client.end()

      console.log('\n🎉 DATABASE CONNECTION WORKING! 🎉')
      console.log('   Use this connection config in your app:\n')
      console.log('   DATABASE_URL="postgresql://postgres@localhost:5432/opus_language?schema=public"')
      return true
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      const code = error instanceof Error && 'code' in error ? String((error as { code?: unknown }).code) : undefined
      console.log('   ❌ Failed:', message)
      if (code) {
        console.log('      Error code:', code)
      }
    }
  }

  console.log('\n❌ ALL CONNECTION ATTEMPTS FAILED ❌')
  console.log('   Check that Docker container is running: docker ps')
  console.log('   Check container logs: docker logs opus-postgres')
  return false
}

void testConnection().then((success) => {
  if (!success) {
    process.exitCode = 1
  }
}).catch((error) => {
  console.error('Unexpected error:', error)
  process.exitCode = 1
})
