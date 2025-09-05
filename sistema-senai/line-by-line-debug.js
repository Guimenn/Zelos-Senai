// Digite estas linhas uma por uma no console:

// 1. Definir token
document.cookie = 'auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc; path=/; max-age=86400';

// 2. Buscar dados do ticket
fetch('/helpdesk/tickets/273982-568', {headers: {'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc', 'Content-Type': 'application/json'}}).then(res => res.json()).then(data => {console.log('Dados:', data); console.log('Criador ID:', data.creator?.id); console.log('Técnico ID:', data.assigned_to?.id); console.log('Criador Nome:', data.creator?.name); console.log('Técnico Nome:', data.assigned_to?.name);});

// 3. Verificar usuário atual
const userData = JSON.parse(atob('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJBZG1pbiIsIm5hbWUiOiJBZG1pbiBUZXN0ZSIsImVtYWlsIjoiYWRtaW5AdGVzdGUuY29tIiwiaWF0IjoxNzU3MDk0MjY3LCJleHAiOjE3NTcxODA2Njd9.BWUmErTRwweGnoc9MY4DYxIwhBgrM4B7daUWWotlrrc'.split('.')[1])); console.log('Usuário atual:', userData);

// 4. Verificar se há botões de chat na página
document.querySelectorAll('button[title*="Abrir chat"]').forEach((btn, i) => console.log(`Botão ${i+1}:`, btn.textContent.trim(), btn.title));
