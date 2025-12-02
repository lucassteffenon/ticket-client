$filePath = "c:\Users\vitor\Desktop\microservices\microservices-front\src\app\pages\attendant-finalize\attendant-finalize.html"
$backupPath = "c:\Users\vitor\Desktop\microservices\microservices-front\src\app\pages\attendant-finalize\attendant-finalize.html.backup"

# Read the file
$content = Get-Content $backupPath -Raw

# Find the position where we need to close the pending events grid
# We need to close </div> after the *ngFor loop ends (line 132 in original)
# Then start the finalized events section at the same level

# The problem: line 134 "<!-- Finalized Events Section -->" is inside the grid
# We need to add a closing </div> before it to close the grid

# Find the pattern and replace
$pattern = '          </div>\r\n\r\n          <!-- Finalized Events Section -->'
$replacement = '          </div>\r\n        </div>\r\n      </div>\r\n\r\n      <!-- Finalized Events Section -->'

$newContent = $content -replace [regex]::Escape($pattern), $replacement

# Write the corrected content
$newContent | Set-Content $filePath -NoNewline
Write-Host "File corrected successfully!"
