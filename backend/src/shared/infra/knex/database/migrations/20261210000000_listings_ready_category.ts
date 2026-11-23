import type { Knex } from 'knex'

/** Nova vitrine "Prontos para morar" (empreendimentos novos já concluídos): `ready` entra na lista de categorias aceitas. */
export async function up(knex: Knex): Promise<void> {
    await knex.raw('ALTER TABLE listings.listings DROP CONSTRAINT IF EXISTS listings_category_check')
    await knex.raw('ALTER TABLE listings.listings ADD CONSTRAINT listings_category_check CHECK ("category" in (\'ready\', \'used\', \'off_plan\', \'under_construction\'))')
}

export async function down(knex: Knex): Promise<void> {
    await knex.raw('UPDATE listings.listings SET "category" = \'used\' WHERE "category" = \'ready\'')
    await knex.raw('ALTER TABLE listings.listings DROP CONSTRAINT IF EXISTS listings_category_check')
    await knex.raw('ALTER TABLE listings.listings ADD CONSTRAINT listings_category_check CHECK ("category" in (\'used\', \'off_plan\', \'under_construction\'))')
}
