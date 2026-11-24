import type { Knex } from 'knex'

/**
 * Permutas/usados editáveis pelo painel (/admin): um anúncio por linha (`data` = formato de data/bambui-permutas.json)
 * e a posição no mapa. Já nasce com a lista de permutas de 2026-10 e as posições conhecidas (só aproximadas).
 */
const INITIAL = [
    {"permuta": {"id": "palco-vaca-brava", "tipo": "apartamento", "cidade": "Goiânia", "bairro": "Jardim América", "condominio": "Edifício Palco Vaca Brava", "quartos": 3, "suites": 3, "vagas": 2, "area": 98, "valor": 930000, "valorCondominio": 960, "destaques": ["27º andar", "Mobília opcional (a consultar)"]}, "place": {"lat": -16.71, "lng": -49.28, "approx": true}},
    {"permuta": {"id": "sobrado-jardins-madri", "tipo": "casa", "cidade": "Goiânia", "bairro": "Jardins Madri", "condominio": null, "quartos": 4, "vagas": 4, "area": 337.54, "areaTerreno": 376.48, "valor": 2450000, "valorCondominio": 1000, "destaques": ["Área gourmet e piscina", "Em condomínio consolidado"]}, "place": {"lat": -16.75, "lng": -49.35, "approx": true}},
    {"permuta": {"id": "sobrado-nova-suica", "tipo": "casa", "cidade": "Goiânia", "bairro": "Nova Suíça", "condominio": null, "quartos": 4, "area": 202, "valor": 850000, "valorCondominio": null}, "place": {"lat": -16.71405, "lng": -49.2731, "approx": true}},
    {"permuta": {"id": "gran-campinas", "tipo": "apartamento", "cidade": "Goiânia", "bairro": "Setor dos Funcionários", "condominio": "Edifício Gran Campinas", "quartos": 3, "suites": 1, "area": 69.27, "valor": 420000, "valorCondominio": 540, "destaques": ["9º andar", "Vista para a praça", "Sacada fechada em vidro", "Condomínio com lazer completo"]}, "place": {"lat": -16.66755, "lng": -49.28443, "approx": true}},
    {"permuta": {"id": "edificio-estevao", "tipo": "apartamento", "cidade": "Goiânia", "bairro": "Setor Leste Vila Nova", "condominio": "Edifício Estêvão", "quartos": 2, "area": 67.42, "valor": 170000, "valorCondominio": 350, "destaques": ["3º andar, acesso por escadas (sem elevador)", "Sem garagem", "Aceita carro como parte do pagamento"]}, "place": {"lat": -16.6657, "lng": -49.24377, "approx": true}},
    {"permuta": {"id": "new-park-clube", "tipo": "apartamento", "cidade": "Goiânia", "bairro": "Jardim Atlântico", "condominio": "Residencial New Park Clube", "quartos": 3, "area": 83, "valor": 540000, "valorCondominio": 650}, "place": {"lat": -16.73, "lng": -49.29, "approx": true}},
    {"permuta": {"id": "lote-garavelo", "tipo": "terreno", "cidade": "Aparecida de Goiânia", "bairro": "Garavelo", "condominio": null, "quartos": 0, "area": 506.51, "valor": 650000, "valorCondominio": null, "destaques": ["Lote plano em avenida asfaltada", "Frente de 12,10 m e comprimento de 41,86 m", "Potencial para projetos comerciais ou residenciais"]}, "place": {"lat": -16.76, "lng": -49.33, "approx": true}},
    {"permuta": {"id": "lote-santos-dumont", "tipo": "terreno", "cidade": "Goiânia", "bairro": "Santos Dumont", "condominio": null, "quartos": 0, "area": 443.8, "valor": 320000, "valorCondominio": null, "destaques": ["Lote de 14 x 30 m", "Casa antiga de 8 ambientes, para reformar ou construir"]}, "place": {"lat": -16.65, "lng": -49.34, "approx": true}},
    {"permuta": {"id": "lote-sollar-ville", "tipo": "terreno", "cidade": "Goiânia", "bairro": "Sollar Ville", "condominio": null, "quartos": 0, "area": 200, "valor": 130000, "valorCondominio": null, "destaques": ["Lote de 10 x 20 m"]}, "place": {"lat": -16.63, "lng": -49.37, "approx": true}},
    {"permuta": {"id": "lote-trindade-romeiros", "tipo": "terreno", "cidade": "Trindade", "bairro": "Rodovia dos Romeiros", "condominio": null, "quartos": 0, "area": 292, "valor": 330000, "valorCondominio": 511}, "place": {"lat": -16.64934, "lng": -49.41601, "approx": true}},
    {"permuta": {"id": "lote-talisma", "tipo": "terreno", "cidade": "Guapó", "bairro": "Loteamento Talismã", "condominio": null, "quartos": 0, "area": 2544.9, "valor": 280000, "valorCondominio": 483}, "place": {"lat": -16.88703, "lng": -49.61703, "approx": true}}
]

export async function up(knex: Knex): Promise<void> {
    await knex.schema.withSchema('listings').createTable('permutas', table => {
        table.string('id', 80).primary()
        table.jsonb('data').notNullable()
        table.decimal('lat', 9, 6).nullable()
        table.decimal('lng', 9, 6).nullable()
        table.boolean('approx').notNullable().defaultTo(true)
        table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now())
    })

    await knex('listings.permutas').insert(INITIAL.map(({ permuta, place }) => ({
        id: permuta.id, data: JSON.stringify(permuta), lat: place?.lat ?? null, lng: place?.lng ?? null, approx: place?.approx ?? true
    })))
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.withSchema('listings').dropTableIfExists('permutas')
}
