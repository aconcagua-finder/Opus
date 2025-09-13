const { Client } = require('pg')
const dns = require('dns').promises

async function testConnection() {
  console.log('=== PostgreSQL Connection Test ===\n')
  
  // First, check DNS resolution
  try {
    const addresses = await dns.resolve4('localhost')
    console.log('✓ localhost resolves to:', addresses)
  } catch (e) {
    console.log('✗ DNS resolution failed:', e.message)
  }
  
  // Test different connection methods
  const connections = [
    {
      name: 'Trust without password (config object)',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'opus_language',
        user: 'postgres',
        // No password!
      }
    },
    {
      name: 'With postgres password',
      config: {
        host: 'localhost',
        port: 5432,
        database: 'opus_language',
        user: 'postgres',
        password: 'postgres'
      }
    },
    {
      name: 'Using 127.0.0.1 instead of localhost',
      config: {
        host: '127.0.0.1',
        port: 5432,
        database: 'opus_language',
        user: 'postgres',
      }
    },
    {
      name: 'Connection string without password',
      config: {
        connectionString: 'postgresql://postgres@localhost:5432/opus_language'
      }
    }
  ]
  
  for (const conn of connections) {
    console.log(`\n⏳ Testing: ${conn.name}`)
    console.log('   Config:', JSON.stringify(conn.config, null, 2))
    
    const client = new Client(conn.config)
    
    try {
      await client.connect()
      const res = await client.query('SELECT NOW(), current_user, inet_server_addr()')
      console.log('   ✅ SUCCESS!')
      console.log('      Time:', res.rows[0].now)
      console.log('      User:', res.rows[0].current_user)
      console.log('      Server:', res.rows[0].inet_server_addr)
      
      // Test table access
      const tableCheck = await client.query('SELECT COUNT(*) FROM users')
      console.log('      Users table count:', tableCheck.rows[0].count)
      
      await client.end()
      
      console.log('\n🎉 DATABASE CONNECTION WORKING! 🎉')
      console.log('   Use this connection config in your app:\n')
      console.log('   DATABASE_URL="postgresql://postgres@localhost:5432/opus_language?schema=public"')
      return true
    } catch (error) {
      console.log('   ❌ Failed:', error.message)
      if (error.code) {
        console.log('      Error code:', error.code)
      }
    }
  }
  
  console.log('\n❌ ALL CONNECTION ATTEMPTS FAILED ❌')
  console.log('   Check that Docker container is running: docker ps')
  console.log('   Check container logs: docker logs opus-postgres')
  return false
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((err) => {
    console.error('Unexpected error:', err)
    process.exit(1)
  })