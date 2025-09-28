const mongoose = require('mongoose');
const GalleryItem = require('../models/GalleryItem');
require('dotenv').config();

// Dados estáticos da galeria que estão no frontend
const staticGalleryData = [
    {
        title: 'Festa de Aniversário Infantil',
        caption: 'Decoração temática com balões e personagens favoritos',
        images: [
            {
                src: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=800&h=600&fit=crop',
                alt: 'Vista geral da festa infantil'
            },
            {
                src: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
                alt: 'Mesa de doces decorada'
            },
            {
                src: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=800&h=600&fit=crop',
                alt: 'Área de brincadeiras'
            }
        ]
    },
    {
        title: 'Casamento Romântico',
        caption: 'Decoração elegante com flores e luzes',
        images: [
            {
                src: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop',
                alt: 'Cerimônia de casamento'
            },
            {
                src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
                alt: 'Mesa dos noivos'
            }
        ]
    },
    {
        title: 'Festa de 15 Anos',
        caption: 'Decoração sofisticada em tons de rosa e dourado',
        images: [
            {
                src: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&h=600&fit=crop',
                alt: 'Salão principal da festa'
            },
            {
                src: 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&h=600&fit=crop',
                alt: 'Mesa de doces elegante'
            },
            {
                src: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
                alt: 'Pista de dança'
            }
        ]
    },
    {
        title: 'Festa Corporativa',
        caption: 'Ambiente profissional com decoração moderna',
        images: [
            {
                src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop',
                alt: 'Evento corporativo principal'
            }
        ]
    },
    {
        title: 'Festa de Formatura',
        caption: 'Celebração especial com decoração temática',
        images: [
            {
                src: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&h=600&fit=crop',
                alt: 'Cerimônia de formatura'
            },
            {
                src: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop',
                alt: 'Mesa de celebração'
            }
        ]
    },
    {
        title: 'Festa de Batizado',
        caption: 'Decoração delicada em tons pastéis',
        images: [
            {
                src: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=800&h=600&fit=crop',
                alt: 'Decoração do batizado'
            },
            {
                src: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop',
                alt: 'Mesa de doces do batizado'
            },
            {
                src: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800&h=600&fit=crop',
                alt: 'Área de convivência'
            }
        ]
    }
];

async function migrateStaticGallery() {
    try {
        console.log('🔄 Conectando ao banco de dados...');
        
        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI || process.env.DATABASE_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Conectado ao banco de dados');
        
        // Verificar se já existem itens no banco
        const existingItems = await GalleryItem.find();
        console.log(`📊 Itens existentes no banco: ${existingItems.length}`);
        
        if (existingItems.length > 0) {
            console.log('⚠️  Já existem itens na galeria. Deseja continuar? (y/N)');
            console.log('   Isso adicionará os itens estáticos junto com os existentes.');
        }
        
        console.log('🔄 Iniciando migração dos dados estáticos...');
        
        let migratedCount = 0;
        
        for (const item of staticGalleryData) {
            try {
                // Verificar se já existe um item com o mesmo título
                const existingItem = await GalleryItem.findOne({ title: item.title });
                
                if (existingItem) {
                    console.log(`⏭️  Item "${item.title}" já existe, pulando...`);
                    continue;
                }
                
                // Criar novo item da galeria
                const galleryItem = new GalleryItem({
                    title: item.title,
                    caption: item.caption,
                    fileData: item.images[0].src, // Primeira imagem como principal
                    fileType: 'image/jpeg', // Tipo padrão para URLs externas
                    fileSize: 1024, // Tamanho padrão para URLs externas (1KB)
                    images: item.images, // Todas as imagens
                    isActive: true,
                    createdAt: new Date()
                });
                
                await galleryItem.save();
                migratedCount++;
                
                console.log(`✅ Migrado: "${item.title}" (${item.images.length} imagens)`);
                
            } catch (itemError) {
                console.error(`❌ Erro ao migrar "${item.title}":`, itemError.message);
            }
        }
        
        console.log(`\n🎉 Migração concluída!`);
        console.log(`📈 Total de itens migrados: ${migratedCount}`);
        console.log(`📊 Total de itens na galeria: ${await GalleryItem.countDocuments()}`);
        
        // Listar todos os itens da galeria
        const allItems = await GalleryItem.find().sort({ createdAt: -1 });
        console.log('\n📋 Itens na galeria:');
        allItems.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.title} (${item.images?.length || 1} imagens)`);
        });
        
    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do banco de dados');
        process.exit(0);
    }
}

// Executar migração
if (require.main === module) {
    migrateStaticGallery();
}

module.exports = migrateStaticGallery;