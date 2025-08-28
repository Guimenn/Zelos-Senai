Write-Host "🧪 Testando correção da localização dos técnicos..." -ForegroundColor Cyan

# 1. Fazer login como admin
Write-Host "🔐 Fazendo login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@senai.com"
    password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token
Write-Host "✅ Login bem-sucedido" -ForegroundColor Green

# 2. Testar a API de agentes
Write-Host "🔍 Testando API de agentes..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$agentsResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/agent?page=1&limit=10" -Method GET -Headers $headers
Write-Host "✅ API de agentes funcionando" -ForegroundColor Green

# 3. Verificar se o campo address está presente
Write-Host "📋 Verificando campo address..." -ForegroundColor Yellow
$agents = $agentsResponse.agents

if ($agents.Count -eq 0) {
    Write-Host "⚠️ Nenhum agente encontrado" -ForegroundColor Yellow
    exit
}

Write-Host "📊 Encontrados $($agents.Count) agentes" -ForegroundColor Cyan

foreach ($agent in $agents) {
    Write-Host "`n👤 Agente: $($agent.user.name)" -ForegroundColor White
    Write-Host "   📧 Email: $($agent.user.email)" -ForegroundColor Gray
    Write-Host "   📱 Telefone: $($agent.user.phone)" -ForegroundColor Gray
    Write-Host "   📍 Endereço: $($agent.user.address)" -ForegroundColor Gray
    Write-Host "   🏢 Departamento: $($agent.department)" -ForegroundColor Gray
}

# 4. Verificar se pelo menos um agente tem endereço
$agentsWithAddress = $agents | Where-Object { $_.user.address }
Write-Host "`n📈 Resumo:" -ForegroundColor Cyan
Write-Host "   - Total de agentes: $($agents.Count)" -ForegroundColor White
Write-Host "   - Com endereço: $($agentsWithAddress.Count)" -ForegroundColor White
Write-Host "   - Sem endereço: $($agents.Count - $agentsWithAddress.Count)" -ForegroundColor White

if ($agentsWithAddress.Count -gt 0) {
    Write-Host "✅ Campo address está sendo retornado corretamente!" -ForegroundColor Green
} else {
    Write-Host "⚠️ Nenhum agente tem endereço cadastrado" -ForegroundColor Yellow
}
