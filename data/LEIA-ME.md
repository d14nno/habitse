# Ajustes dos empreendimentos da Bambuí

O site da Bambuí **não publica** preço, registro de incorporação nem previsão de entrega. Esses dados vêm de três lugares
(do mais fraco para o mais forte):

1. **Fotos** (`bambui-fotos.json`): copiadas do Drive para o site por `npm run sync:fotos` (só quando há material novo).
2. **Tabelas do Drive** (`bambui-tabelas.json`): a rotina lê, uma vez por mês (do 1º dia útil até o dia 7), os PDFs da pasta
   "0 - TABELAS" e grava o **preço "a partir de"** (menor valor entre as unidades disponíveis), a quantidade de unidades, a
   entrega das chaves (quando a tabela traz) e o registro de incorporação citado no rodapé. Tabela com mais de 2 meses perde a validade (preço volta a "Sob consulta").
   Não edite esse arquivo: ele é regravado. A "Tabela Especial" não é lida.
3. **Ajustes à mão** (`bambui-ajustes.json`): valem mais que tudo e **a rotina nunca os sobrescreve**.

**Permutas:** `bambui-permutas.json` (lista de revendas) vira anúncios em "Imóveis usados" com o selo "Permuta Bambuí". Mostra só o
bairro; endereço exato, unidade, ocupação, comissão e contato pessoal ficam de fora. Atualize o arquivo quando sair a lista nova.

Para editar sem mexer em código: abra o arquivo no GitHub (lápis "Edit"), altere e salve ("Commit changes").
O site se atualiza sozinho em alguns minutos.

## Formato

Uma entrada por empreendimento; a chave é o final do endereço da página da Bambuí (`bambui.com.br/lancamento/<chave>/`).

```json
{
  "praca-232": {
    "price": 1450000,
    "deliveryDate": "2028-12",
    "incorporation": "R-3 da matrícula 12.345 do 1º CRI de Goiânia · Incorporador: Bambuí Empreendimentos Ltda"
  },
  "vox-home": { "status": "published", "price": 1380000 }
}
```

| Campo | O que é |
|---|---|
| `price` | Preço em reais, só números (ex.: `1450000`). `null` = "Sob consulta" |
| `deliveryDate` | Previsão de entrega, `"AAAA-MM"` |
| `incorporation` | Registro de incorporação e incorporador, como a lei exige na publicidade |
| `status` | `"published"` aparece no site; `"draft"` fica oculto. Os **já prontos** (Vox Home, Ares Marista, B.Great…) começam ocultos |
| `priceNote` | Texto sob o preço (a rotina preenche com o mês da tabela) |
| `featured` | `true` coloca no destaque da página inicial |
| `title`, `description`, `address`, `area`, `bedrooms`, `suites`, `bathrooms`, `parking`, `category`, `photos` | Substituem o que veio do site da Bambuí |

Erros de digitação (campo desconhecido, número em vez de texto, data fora do formato) **impedem** a atualização e aparecem na aba
*Actions* do GitHub; o site continua com a versão anterior.
