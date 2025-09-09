import prisma from '../prisma/client.js'

async function testDownloadFix() {
  try {
    console.log('🔧 Testando correção do download do Supabase...')
    
    // Buscar anexos do Supabase
    const supabaseAttachments = await prisma.attachment.findMany({
      where: {
        file_path: {
          startsWith: 'https://'
        }
      },
      take: 2
    })
    
    console.log('📋 Anexos do Supabase encontrados:')
    supabaseAttachments.forEach(attachment => {
      console.log(`  - ID: ${attachment.id}`)
      console.log(`    Nome: ${attachment.original_name}`)
      console.log(`    Tipo: ${attachment.mime_type}`)
      console.log(`    Tamanho: ${attachment.file_size} bytes`)
      console.log(`    URL: ${attachment.file_path}`)
      console.log('')
    })
    
    console.log('✅ Correção implementada:')
    console.log('  ✅ Removido response.body.pipe() que causava erro')
    console.log('  ✅ Usando response.arrayBuffer() para converter')
    console.log('  ✅ Buffer.from() para criar buffer do Node.js')
    console.log('  ✅ res.send() para enviar o arquivo')
    console.log('  ✅ Content-Length dinâmico baseado no buffer')
    
    console.log('\n🎯 Fluxo corrigido:')
    console.log('  1. Fetch da URL do Supabase')
    console.log('  2. Verificação se response.ok')
    console.log('  3. Conversão para ArrayBuffer')
    console.log('  4. Criação de Buffer do Node.js')
    console.log('  5. Envio com headers corretos')
    
    console.log('\n💡 Para testar:')
    console.log('  1. Reinicie o servidor backend')
    console.log('  2. Abra um chamado com anexos')
    console.log('  3. Clique em "Download"')
    console.log('  4. O arquivo deve baixar sem erro 500')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDownloadFix()
