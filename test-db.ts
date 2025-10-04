import { Client } from 'pg'

async function testConnection(): Promise<void> {
  const urls = [
    'postgresql://postgres@localhost:5432/opus_language',
    'postgresql://postgres:postgres@localhost:5432/opus_language',
    'postgresql://postgres:anypass@localhost:5432/opus_language',
  ]

  for (const url of urls) {
    console.log(`\nTesting: ${url}`)
    const client = new Client({ connectionString: url })

    try {
      await client.connect()
      const res = await client.query('SELECT NOW()')
      console.log('✅ SUCCESS! Time:', res.rows[0].now)
      await client.end()
      return
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      console.log('❌ Failed:', message)
    }
  }
}

void testConnection()
