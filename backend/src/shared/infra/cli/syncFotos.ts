/* eslint-disable no-console */
/**
 * Copia as fotos dos empreendimentos e das permutas da pasta pública do Drive da Bambuí para o próprio site
 * (frontend/public/fotos/<anúncio>/NN.jpg, reduzidas), e registra em `data/bambui-fotos.json`.
 * O site deixa de depender do site da Bambuí para exibir as imagens.
 *
 * Uso: npm run sync:fotos                          (todos os empreendimentos e permutas)
 *      npm run sync:fotos -- --only=praca-232       (um anúncio; para permuta use permuta-<id>)
 *      npm run sync:fotos -- --dry-run              (mostra o que baixaria, sem gravar)
 *      npm run sync:fotos -- --force                (baixa de novo mesmo as fotos que já estão no site)
 *      npm run sync:fotos -- --pasta=permuta-gran-campinas:C:\fotos   (usa as imagens de uma pasta do computador)
 *
 * As fotos escolhidas ficam no repositório (não há nova leitura do Drive a cada mês): rode de novo só quando houver
 * material novo. Fotos que você incluir à mão em `photos` no arquivo de ajustes valem mais que estas.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import path from 'path'
import sharp from 'sharp'

import { DriveEntry, DriveFolder } from '@modules/listings/services/DriveFolder'
import { IMAGE_FILE, PhotoGroup, pickPhotos, SKIPPED_FOLDER, slugForFolder, slugForPermutaFolder } from '@modules/listings/services/PhotoPicker'

const DEFAULT_FOLDER = '1UOtIM779pM9B_ZqhAQ_2HS9xM4DZLzwG'
const MAX_PHOTOS = 12
const MAX_DEPTH = 4

const root = path.resolve(process.cwd(), '..')
const flag = (name: string) => process.argv.includes(`--${name}`)
const value = (name: string, fallback = '') => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3) ?? fallback
const fotosFile = path.resolve(root, 'data/bambui-fotos.json')
const outDir = path.resolve(root, 'frontend/public/fotos')

type Fotos = Record<string, { file: string, source: string }[]>

const drive = new DriveFolder()

/** Todas as pastas com imagens abaixo de `folderId`, sem as que não são fotos do imóvel */
async function collect(folderId: string, label: string, depth = 0): Promise<PhotoGroup[]> {
    const entries = await drive.list(folderId)
    const groups: PhotoGroup[] = [{ path: label, files: entries.filter(entry => entry.kind === 'file') }]

    if (depth < MAX_DEPTH) {
        for (const folder of entries.filter(entry => entry.kind === 'folder' && !SKIPPED_FOLDER.test(entry.name))) groups.push(...(await collect(folder.id, `${label}/${folder.name}`, depth + 1)))
    }

    return groups
}

async function photoFolder(projectFolderId: string, name: string): Promise<PhotoGroup[]> {
    const entries = await drive.list(projectFolderId)
    const photos = entries.filter(entry => entry.kind === 'folder' && /foto|imagens/i.test(entry.name))

    return (await Promise.all(photos.map(entry => collect(entry.id, entry.name)))).flat().map(group => ({ ...group, path: `${name}/${group.path}` }))
}

async function save(slug: string, index: number, original: Buffer): Promise<string> {
    const dir = path.join(outDir, slug)
    mkdirSync(dir, { recursive: true })

    const name = `${String(index + 1).padStart(2, '0')}.jpg`
    await sharp(original).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(dir, name))

    return `/fotos/${slug}/${name}`
}

async function main() {
    const only = value('only')
    const dryRun = flag('dry-run')
    const known: Fotos = existsSync(fotosFile) ? JSON.parse(readFileSync(fotosFile, 'utf8')) : {}
    const result: Fotos = { ...known }

    const local = value('pasta')
    if (local) {
        const [slug, ...rest] = local.split(':')
        const dir = rest.join(':')
        const files = readdirSync(dir).filter(file => IMAGE_FILE.test(file)).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true })).slice(0, MAX_PHOTOS)

        if (!slug || !files.length) throw new Error('Use --pasta=<anúncio>:<pasta com imagens .jpg/.png/.webp>')

        rmSync(path.join(outDir, slug), { recursive: true, force: true })
        result[slug] = []
        for (let index = 0; index < files.length; index++) result[slug].push({ file: await save(slug, index, readFileSync(path.join(dir, files[index]))), source: `local:${files[index]}` })
        console.log(`✅ ${slug}: ${files.length} foto(s) da pasta ${dir}`)
    } else {
        const rootEntries = await drive.list(value('folder', DEFAULT_FOLDER))
        const targets: { slug: string, groups: () => Promise<PhotoGroup[]> }[] = []

        for (const entry of rootEntries.filter(item => item.kind === 'folder')) {
            const slug = slugForFolder(entry.name)
            if (slug) targets.push({ slug, groups: () => photoFolder(entry.id, entry.name) })

            if (/^8\s*-\s*permutas/i.test(entry.name)) {
                for (const folder of (await drive.list(entry.id)).filter(item => item.kind === 'folder')) {
                    const permuta = slugForPermutaFolder(folder.name)
                    if (permuta) targets.push({ slug: permuta, groups: () => collect(folder.id, folder.name) })
                    else console.warn(`⚠️  pasta de permuta sem anúncio correspondente (ignorada): ${folder.name}`)
                }
            }
        }

        for (const { slug, groups } of targets.filter(target => !only || target.slug === only)) {
            const picked: DriveEntry[] = pickPhotos(await groups(), MAX_PHOTOS)

            if (!picked.length) {
                console.log(`➖ ${slug}: nenhuma imagem na pasta`)
                continue
            }

            const unchanged = !flag('force') && known[slug]?.length === picked.length && known[slug].every((photo, index) => photo.source === picked[index].id && existsSync(path.join(root, 'frontend/public', photo.file)))
            if (unchanged || dryRun) {
                console.log(`${unchanged ? '✔️ ' : '📥'} ${slug}: ${picked.length} foto(s)${unchanged ? ' (já no site)' : ''}`)
                continue
            }

            rmSync(path.join(outDir, slug), { recursive: true, force: true })
            result[slug] = []
            for (let index = 0; index < picked.length; index++) result[slug].push({ file: await save(slug, index, await drive.download(picked[index].id)), source: picked[index].id })
            console.log(`✅ ${slug}: ${picked.length} foto(s) copiadas`)
        }
    }

    if (!dryRun) writeFileSync(fotosFile, `${JSON.stringify(Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`)
}

main().catch(error => {
    console.error('❌', error instanceof Error ? error.message : error)
    process.exit(1)
})
