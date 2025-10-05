const jwt = require('jsonwebtoken');

async function testEdit() {
  try {
    // Gerar token de autenticação
    const token = jwt.sign(
      { id: '68d8221a42194c154a841163', username: 'admin', role: 'admin' },
      'your-secret-key'
    );

    console.log('🔑 Token gerado');

    // Fazer requisição para listar itens da galeria
    const response = await fetch('http://localhost:3000/api/gallery', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('\n📋 Resposta da galeria:', data.success ? 'Sucesso' : 'Erro');
    
    if (data.success && data.items && data.items.length > 0) {
      const firstItem = data.items[0];
      console.log('\n🔍 Primeiro item:');
      console.log('- ID:', firstItem.id);
      console.log('- Title:', firstItem.title);
      console.log('- Images:', firstItem.images ? `${firstItem.images.length} imagens` : 'nenhuma');
      console.log('- FileData:', firstItem.fileData ? 'existe' : 'não existe');
      
      // Simular uma edição preservando as imagens
      const updateData = {
        title: firstItem.title,
        caption: firstItem.caption,
        category: firstItem.category,
        date: firstItem.date,
        isActive: firstItem.isActive
      };

      // Incluir imagens se existirem
      if (firstItem.images && firstItem.images.length > 0) {
        updateData.images = firstItem.images.map(img => ({
          data: img.src,
          type: 'image/jpeg',
          name: img.alt || 'Imagem',
          size: 0,
          isExisting: true
        }));
        console.log('\n📸 Incluindo', updateData.images.length, 'imagens existentes');
      } else if (firstItem.fileData) {
        updateData.images = [{
          data: firstItem.fileData,
          type: firstItem.fileType || 'image/jpeg',
          name: 'Imagem existente',
          size: 0,
          isExisting: true
        }];
        console.log('\n📸 Incluindo 1 imagem do formato antigo');
      } else {
        updateData.images = [];
        console.log('\n📸 Nenhuma imagem para incluir');
      }
      
      console.log('\n🔄 Enviando edição...');
      
      const editResponse = await fetch(`http://localhost:3000/api/gallery/${firstItem.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const editResult = await editResponse.json();
      console.log('\n✅ Resultado da edição:', editResult.success ? 'Sucesso' : 'Erro');
      if (!editResult.success) {
        console.log('❌ Erro:', editResult.message);
      }
    } else {
      console.log('❌ Nenhum item encontrado na galeria');
    }
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testEdit();