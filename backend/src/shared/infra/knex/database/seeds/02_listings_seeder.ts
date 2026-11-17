import { Knex } from 'knex'

/**
 * Anúncios de EXEMPLO para desenvolvimento e para o site abrir com conteúdo antes do cadastro real.
 * Todos os dados são fictícios (endereços, construtoras e valores). Fotos: ilustrações do próprio site (/placeholders).
 * Rodar: npm run seed:run -- --specific=02_listings_seeder.ts  (apaga e recria só os anúncios de exemplo)
 */
// Anúncios de exemplo são reconhecidos pelas fotos de ilustração (/placeholders): fotos reais nunca são apagadas pelo seed
const SAMPLE_PHOTOS = '/placeholders/'

type Row = {
    title: string, category: 'used' | 'off_plan' | 'under_construction', type: string, price: number | null
    city: string, neighborhood: string, bedrooms: number, suites: number, bathrooms: number, parking: number, area: number
    developer?: string, deliveryDate?: string, progress?: number, featured?: boolean, features: string[], blurb: string
}

const GOIANIA = 'Goiânia'

const ROWS: Row[] = [
    // ---- Usados
    { title: 'Apartamento 3 quartos no Setor Bueno', category: 'used', type: 'apartamento', price: 685000, city: GOIANIA, neighborhood: 'Setor Bueno', bedrooms: 3, suites: 1, bathrooms: 2, parking: 2, area: 98, featured: true, features: ['Varanda gourmet', 'Armários planejados', 'Portaria 24h', 'Piscina', 'Academia'], blurb: 'Bem conservado, andar alto, sol da manhã e vista livre.' },
    { title: 'Casa em condomínio fechado no Jardins Mônaco', category: 'used', type: 'casa_condominio', price: 1890000, city: GOIANIA, neighborhood: 'Jardins Mônaco', bedrooms: 4, suites: 4, bathrooms: 5, parking: 4, area: 320, featured: true, features: ['Piscina privativa', 'Área gourmet', 'Energia solar', 'Segurança 24h'], blurb: 'Condomínio com lazer completo, casa reformada e pronta para morar.' },
    { title: 'Apartamento 2 quartos no Setor Marista', category: 'used', type: 'apartamento', price: 520000, city: GOIANIA, neighborhood: 'Setor Marista', bedrooms: 2, suites: 1, bathrooms: 2, parking: 1, area: 72, features: ['Varanda', 'Condomínio com lazer', 'Perto de comércio'], blurb: 'Ótima localização, a poucos passos de padarias, academias e escolas.' },
    { title: 'Casa térrea 3 quartos no Jardim América', category: 'used', type: 'casa', price: 740000, city: GOIANIA, neighborhood: 'Jardim América', bedrooms: 3, suites: 1, bathrooms: 3, parking: 3, area: 180, features: ['Quintal amplo', 'Churrasqueira', 'Portão eletrônico'], blurb: 'Casa ampla em rua tranquila, com quintal e espaço para ampliar.' },
    { title: 'Cobertura duplex no Setor Oeste', category: 'used', type: 'cobertura', price: 1450000, city: GOIANIA, neighborhood: 'Setor Oeste', bedrooms: 3, suites: 3, bathrooms: 4, parking: 3, area: 210, features: ['Terraço com piscina', 'Churrasqueira', 'Vista panorâmica'], blurb: 'Duplex com terraço, sem vizinho acima e vista aberta da cidade.' },
    { title: 'Sala comercial no Setor Bueno', category: 'used', type: 'sala_comercial', price: 310000, city: GOIANIA, neighborhood: 'Setor Bueno', bedrooms: 0, suites: 0, bathrooms: 1, parking: 1, area: 42, features: ['Recepção', 'Elevador', 'Estacionamento rotativo'], blurb: 'Sala pronta para consultório ou escritório, em prédio comercial bem localizado.' },
    // ---- Na planta
    { title: 'Residencial Alameda Verde — 2 e 3 quartos', category: 'off_plan', type: 'apartamento', price: 489000, city: GOIANIA, neighborhood: 'Jardim Goiás', bedrooms: 2, suites: 1, bathrooms: 2, parking: 1, area: 68, developer: 'Construtora Exemplo', deliveryDate: '2029-12', featured: true, features: ['Lazer completo', 'Coworking', 'Pet place', 'Bicicletário'], blurb: 'Lançamento com condições de entrada facilitadas e fluxo de pagamento até a entrega.' },
    { title: 'Torre Horizonte — 3 suítes', category: 'off_plan', type: 'apartamento', price: 1250000, city: GOIANIA, neighborhood: 'Setor Marista', bedrooms: 3, suites: 3, bathrooms: 4, parking: 2, area: 128, developer: 'Incorporadora Exemplo', deliveryDate: '2030-06', featured: true, features: ['Rooftop', 'Spa', 'Automação', 'Gerador'], blurb: 'Alto padrão no Marista, com plantas amplas e acabamento diferenciado.' },
    { title: 'Vila Bosque — casas em condomínio', category: 'off_plan', type: 'casa_condominio', price: 960000, city: 'Aparecida de Goiânia', neighborhood: 'Jardim Europa', bedrooms: 3, suites: 3, bathrooms: 4, parking: 2, area: 165, developer: 'Construtora Exemplo', deliveryDate: '2029-09', features: ['Clube', 'Quadra de tênis', 'Trilhas'], blurb: 'Casas em condomínio-clube com lotes de bom tamanho e muita área verde.' },
    { title: 'Studio Central — investimento', category: 'off_plan', type: 'apartamento', price: 268000, city: GOIANIA, neighborhood: 'Setor Central', bedrooms: 1, suites: 1, bathrooms: 1, parking: 0, area: 31, developer: 'Incorporadora Exemplo', deliveryDate: '2028-12', features: ['Mobiliado', 'Lavanderia compartilhada', 'Gestão de locação'], blurb: 'Studio compacto para renda de aluguel, perto de universidades e hospitais.' },
    { title: 'Lotes Parque das Águas', category: 'off_plan', type: 'terreno', price: 215000, city: 'Senador Canedo', neighborhood: 'Parque das Águas', bedrooms: 0, suites: 0, bathrooms: 0, parking: 0, area: 300, developer: 'Loteadora Exemplo', deliveryDate: '2028-03', features: ['Infraestrutura completa', 'Portaria', 'Área de lazer'], blurb: 'Lotes em loteamento fechado, com financiamento direto e parcelas a perder de vista.' },
    { title: 'Edifício Prime Office — salas comerciais', category: 'off_plan', type: 'sala_comercial', price: 395000, city: GOIANIA, neighborhood: 'Jardim Goiás', bedrooms: 0, suites: 0, bathrooms: 1, parking: 1, area: 45, developer: 'Incorporadora Exemplo', deliveryDate: '2030-03', features: ['Fachada de vidro', 'Heliponto', 'Salas de reunião'], blurb: 'Salas corporativas em região nobre, com alto potencial de valorização.' },
    // ---- Em construção
    { title: 'Residencial Pôr do Sol — obra em andamento', category: 'under_construction', type: 'apartamento', price: 559000, city: GOIANIA, neighborhood: 'Setor Bueno', bedrooms: 3, suites: 1, bathrooms: 2, parking: 2, area: 84, developer: 'Construtora Exemplo', deliveryDate: '2027-08', progress: 62, featured: true, features: ['Varanda gourmet', 'Piscina aquecida', 'Salão de festas'], blurb: 'Obra com 62% concluída e entrega prevista para agosto de 2027.' },
    { title: 'Edifício Aurora — 2 quartos', category: 'under_construction', type: 'apartamento', price: 420000, city: GOIANIA, neighborhood: 'Vila Rosa', bedrooms: 2, suites: 1, bathrooms: 2, parking: 1, area: 62, developer: 'Incorporadora Exemplo', deliveryDate: '2027-04', progress: 78, features: ['Academia', 'Brinquedoteca', 'Pet care'], blurb: 'Fase de acabamentos, ótima oportunidade para quem quer entregar em breve.' },
    { title: 'Condomínio Reserva do Cerrado — casas', category: 'under_construction', type: 'casa_condominio', price: 1120000, city: 'Aparecida de Goiânia', neighborhood: 'Jardins Atenas', bedrooms: 4, suites: 4, bathrooms: 5, parking: 3, area: 240, developer: 'Construtora Exemplo', deliveryDate: '2027-11', progress: 45, features: ['Piscina', 'Energia solar', 'Segurança 24h'], blurb: 'Casas de alto padrão com obra em ritmo acelerado e fotos mensais do avanço.' },
    { title: 'Torre Vista Park — 3 quartos', category: 'under_construction', type: 'apartamento', price: 735000, city: GOIANIA, neighborhood: 'Parque Amazônia', bedrooms: 3, suites: 2, bathrooms: 3, parking: 2, area: 96, developer: 'Incorporadora Exemplo', deliveryDate: '2026-12', progress: 91, features: ['Rooftop', 'Coworking', 'Quadra de areia'], blurb: 'Reta final de obra, com entrega prevista ainda este ano.' },
    { title: 'Loft Urbano — compactos', category: 'under_construction', type: 'apartamento', price: 335000, city: GOIANIA, neighborhood: 'Setor Universitário', bedrooms: 1, suites: 1, bathrooms: 1, parking: 1, area: 38, developer: 'Construtora Exemplo', deliveryDate: '2027-06', progress: 55, features: ['Mobiliado', 'Coworking', 'Lavanderia'], blurb: 'Compactos perto das universidades, com alta procura para locação.' },
    { title: 'Business Center Norte — salas', category: 'under_construction', type: 'sala_comercial', price: 289000, city: GOIANIA, neighborhood: 'Setor Norte Ferroviário', bedrooms: 0, suites: 0, bathrooms: 1, parking: 1, area: 36, developer: 'Incorporadora Exemplo', deliveryDate: '2027-09', progress: 33, features: ['Fachada ativa', 'Estacionamento', 'Recepção'], blurb: 'Salas comerciais com obra iniciada, valores de lançamento ainda mantidos.' }
]

const slugify = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export async function seed(knex: Knex): Promise<void> {
    // Só os anúncios de exemplo (cadastros reais não são tocados)
    await knex('listings.listings').whereRaw('"photos"::text like ?', [`%${SAMPLE_PHOTOS}%`]).del()

    const now = Date.now()
    await knex('listings.listings').insert(ROWS.map((row, index) => ({
        slug: slugify(`${row.title}-${index + 1}`),
        title: row.title,
        category: row.category,
        type: row.type,
        status: 'published',
        price: row.price,
        city: row.city,
        state: 'GO',
        neighborhood: row.neighborhood,
        address: `${row.neighborhood}, ${row.city} - GO`,
        bedrooms: row.bedrooms,
        suites: row.suites,
        bathrooms: row.bathrooms,
        parking: row.parking,
        area: row.area,
        description: `${row.blurb}\n\nAnúncio de demonstração: valores, endereço e construtora são fictícios.`,
        features: JSON.stringify(row.features),
        // 5 ilustrações por anúncio (arquivos do frontend), variando a ordem para as capas não se repetirem
        photos: JSON.stringify([0, 1, 2, 3, 4].map(offset => `/placeholders/${row.category}-${((index + offset) % 5) + 1}.svg`)),
        developer: row.developer ?? null,
        deliveryDate: row.deliveryDate ?? null,
        constructionProgress: row.progress ?? null,
        featured: Boolean(row.featured),
        createdAt: new Date(now - index * 3600 * 1000 * 6)
    })))
}
