var BASE_URL = 'http://10.0.2.2:8000'

var response = http.post(BASE_URL + '/api/test/reset', {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({})
})

if (response.status !== 200) {
  console.log('Cleanup warning: ' + response.status)
}
