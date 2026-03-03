const start = new Date().toISOString()
const end = new Date(Date.now() + 3600000).toISOString()

fetch('http://localhost:3000/api/admin/blocked-slots', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ start, end, reason: 'Test' })
})
    .then(r => r.json())
    .then(console.log)
    .catch(console.error)
