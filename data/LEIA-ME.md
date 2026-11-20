# Ajustes dos empreendimentos da Bambuí

O site da Bambuí **não publica** preço, registro de incorporação nem previsão de entrega. Esses dados (e outros ajustes) ficam
em `bambui-ajustes.json` e **a importação diária nunca os sobrescreve**.

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
| `featured` | `true` coloca no destaque da página inicial |
| `title`, `description`, `address`, `area`, `bedrooms`, `suites`, `bathrooms`, `parking`, `category`, `photos` | Substituem o que veio do site da Bambuí |

Erros de digitação (campo desconhecido, número em vez de texto, data fora do formato) **impedem** a atualização e aparecem na aba
*Actions* do GitHub; o site continua com a versão anterior.
