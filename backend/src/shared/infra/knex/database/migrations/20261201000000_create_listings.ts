import type { Knex } from 'knex'

/** Vitrine de imóveis: um anúncio por linha, em categorias (oportunidades de mercado, prontos, lançamentos, em construção). */
export async function up(knex: Knex): Promise<void> {
    await knex.raw('CREATE SCHEMA IF NOT EXISTS listings')

    await knex.schema.withSchema('listings').createTable('listings', table => {
        table.bigIncrements('id').primary()
        table.string('slug', 160).notNullable().unique()
        table.string('title', 160).notNullable()
        table.string('category', 30).notNullable()
        table.string('type', 30).notNullable()
        table.string('status', 20).notNullable().defaultTo('published')
        table.decimal('price', 14, 2).nullable()
        table.string('city', 80).notNullable()
        table.string('state', 2).notNullable()
        table.string('neighborhood', 80).notNullable()
        table.string('address', 200).nullable()
        table.smallint('bedrooms').notNullable().defaultTo(0)
        table.smallint('suites').notNullable().defaultTo(0)
        table.smallint('bathrooms').notNullable().defaultTo(0)
        table.smallint('parking').notNullable().defaultTo(0)
        table.decimal('area', 10, 2).nullable()
        table.text('description').notNullable().defaultTo('')
        table.jsonb('features').notNullable().defaultTo('[]')
        table.jsonb('photos').notNullable().defaultTo('[]')
        table.string('developer', 120).nullable()
        table.string('deliveryDate', 7).nullable()
        table.smallint('constructionProgress').nullable()
        table.boolean('featured').notNullable().defaultTo(false)
        table.timestamp('createdAt', { useTz: true }).notNullable().defaultTo(knex.fn.now())
        table.timestamp('updatedAt', { useTz: true }).notNullable().defaultTo(knex.fn.now())

        table.check('?? in (\'used\', \'off_plan\', \'under_construction\')', ['category'], 'listings_category_check')
        table.check('?? in (\'published\', \'draft\', \'sold\')', ['status'], 'listings_status_check')
        table.check('?? is null or (?? between 0 and 100)', ['constructionProgress', 'constructionProgress'], 'listings_progress_check')
    })

    // Filtros da vitrine: sempre só publicados, por categoria e ordenados por data/preço
    await knex.raw('CREATE INDEX listings_category_idx ON listings.listings ("category", "featured" DESC, "createdAt" DESC) WHERE "status" = \'published\'')
    await knex.raw('CREATE INDEX listings_city_idx ON listings.listings ("city", "neighborhood") WHERE "status" = \'published\'')
    await knex.raw('CREATE INDEX listings_price_idx ON listings.listings ("price") WHERE "status" = \'published\'')
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.withSchema('listings').dropTableIfExists('listings')
    await knex.raw('DROP SCHEMA IF EXISTS listings')
}
