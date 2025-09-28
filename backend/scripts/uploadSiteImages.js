const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/database');
const SiteImage = require('../models/SiteImage');

async function uploadSiteImages() {
    try {
        console.log('🚀 Iniciando upload das imagens do site...');
        
        // Conectar ao banco de dados
        await connectDB();
        console.log('✅ Conectado ao banco de dados');

        // Definir as imagens a serem carregadas
        const imagesToUpload = [
            {
                name: 'home',
                description: 'Imagem principal da página inicial',
                filePath: path.join(__dirname, '../../img/home.jpg')
            },
            {
                name: 'about',
                description: 'Imagem da seção sobre nós',
                filePath: path.join(__dirname, '../../img/about.jpg')
            },
            {
                name: 'logo',
                description: 'Logo da empresa',
                filePath: path.join(__dirname, '../../img/logo.png')
            }
        ];

        for (const imageConfig of imagesToUpload) {
            try {
                console.log(`\n📸 Processando ${imageConfig.name}...`);
                
                // Verificar se o arquivo existe
                try {
                    await fs.access(imageConfig.filePath);
                } catch (error) {
                    console.log(`⚠️  Arquivo não encontrado: ${imageConfig.filePath}`);
                    continue;
                }

                // Ler o arquivo
                const fileBuffer = await fs.readFile(imageConfig.filePath);
                const fileBase64 = fileBuffer.toString('base64');
                
                // Determinar o tipo MIME
                const ext = path.extname(imageConfig.filePath).toLowerCase();
                const mimeType = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg',
                    '.png': 'image/png',
                    '.webp': 'image/webp'
                }[ext] || 'image/jpeg';

                // Verificar se já existe uma imagem ativa com este nome
                const existingImage = await SiteImage.findActiveByName(imageConfig.name);
                
                if (existingImage) {
                    console.log(`ℹ️  Imagem '${imageConfig.name}' já existe no banco. Atualizando...`);
                    
                    // Desativar a imagem anterior
                    await SiteImage.updateMany(
                        { name: imageConfig.name, isActive: true },
                        { isActive: false }
                    );
                }

                // Buscar a versão mais recente
                const lastImage = await SiteImage.findOne({ name: imageConfig.name }).sort({ version: -1 });
                const newVersion = lastImage ? lastImage.version + 1 : 1;

                // Criar nova imagem
                const siteImage = new SiteImage({
                    name: imageConfig.name,
                    description: imageConfig.description,
                    fileData: fileBase64,
                    fileType: mimeType,
                    version: newVersion
                });

                await siteImage.save();

                console.log(`✅ Imagem '${imageConfig.name}' salva com sucesso!`);
                console.log(`   - Versão: ${newVersion}`);
                console.log(`   - Tipo: ${mimeType}`);
                console.log(`   - Tamanho: ${Math.round(siteImage.fileSize / 1024)}KB`);

            } catch (error) {
                console.error(`❌ Erro ao processar ${imageConfig.name}:`, error.message);
            }
        }

        console.log('\n🎉 Upload concluído!');
        
        // Listar imagens no banco
        const images = await SiteImage.find({ isActive: true }).select('-fileData');
        console.log('\n📋 Imagens ativas no banco:');
        images.forEach(img => {
            console.log(`   - ${img.name} (v${img.version}) - ${Math.round(img.fileSize / 1024)}KB`);
        });

    } catch (error) {
        console.error('❌ Erro geral:', error);
    } finally {
        process.exit(0);
    }
}

// Executar o script
uploadSiteImages();