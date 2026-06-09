$ErrorActionPreference = "Stop"

# Step 1: Login
$loginBody = '{"email":"photographer@eventmanager.com","password":"PhotoPassword123"}'
$loginResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/auth/login' -Method POST -ContentType 'application/json' -Body $loginBody -SessionVariable ws
Write-Host "Login Status: $($loginResponse.StatusCode)"
$loginData = $loginResponse.Content | ConvertFrom-Json
Write-Host "Logged in as: $($loginData.user.name) Role: $($loginData.user.role)"

# Step 2: Create Event
$eventBody = '{"name":"Photography Workshop 2025","category":"Concert","date":"2025-12-20","location":"Grand Hall, NYC","description":"Annual photography showcase"}'
$eventResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/events' -Method POST -ContentType 'application/json' -Body $eventBody -WebSession $ws
Write-Host "Create Event Status: $($eventResponse.StatusCode)"
$eventData = $eventResponse.Content | ConvertFrom-Json
Write-Host "Event created: $($eventData.event.id) - $($eventData.event.name)"

$eventId = $eventData.event.id

# Step 3: Create Albums
$album1Body = '{"name":"Main Stage"}'
$albumResponse1 = Invoke-WebRequest -Uri "http://localhost:3000/api/events/$eventId/albums" -Method POST -ContentType 'application/json' -Body $album1Body -WebSession $ws
Write-Host "Create Album 1 Status: $($albumResponse1.StatusCode)"

$album2Body = '{"name":"Behind the Scenes"}'
$albumResponse2 = Invoke-WebRequest -Uri "http://localhost:3000/api/events/$eventId/albums" -Method POST -ContentType 'application/json' -Body $album2Body -WebSession $ws
Write-Host "Create Album 2 Status: $($albumResponse2.StatusCode)"

# Step 4: Fetch Events and verify albums are returned
$fetchResponse = Invoke-WebRequest -Uri 'http://localhost:3000/api/events' -WebSession $ws
$fetchData = $fetchResponse.Content | ConvertFrom-Json
Write-Host "Total events: $($fetchData.events.Count)"
$ourEvent = $fetchData.events | Where-Object { $_.id -eq $eventId }
Write-Host "Albums returned: $($ourEvent.albums | ConvertTo-Json)"
