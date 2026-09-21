# 3. Modelo de datos

**Imagen:** [03-modelo-de-datos.png](img/03-modelo-de-datos.png) · [.svg](img/03-modelo-de-datos.svg)

> **Advertencia sobre la fuente.** `dosventa-dev-db` tiene
> `PubliclyAccessible: false` y vive en subredes privadas, así que **no se pudo
> consultar el esquema desplegado**. Lo que sigue se leyó del
> `information_schema` de la base local, que aplica las mismas migraciones
> numeradas del repositorio.
>
> **Hay una diferencia conocida:** la imagen desplegada es `main-5ef5748`, que
> incluye migraciones `0001`–`0012`. La `0013_fotos_y_reportes_de_chat.sql` está
> en el árbol de trabajo **sin confirmar**, así que `messages.image_path`,
> `chat_reports` y la restricción `messages_con_algo_dentro` **existen abajo pero
> todavía no en RDS**. Van marcadas.

## Evidencia

- Tablas: `select table_name from information_schema.tables where table_schema='public'` → 35 tablas.
- Claves foráneas: consulta sobre `information_schema.table_constraints` + `key_column_usage` + `constraint_column_usage` → 48 relaciones.
- Columnas: `information_schema.columns` por tabla.
- Migraciones confirmadas: `git ls-files db/migrations/` → `0001`…`0012`.
- Migración sin confirmar: `git status --short db/migrations/` → `?? 0013_fotos_y_reportes_de_chat.sql`.

## Dominio del producto

```mermaid
erDiagram
    user ||--o{ listings : vende
    user ||--o{ orders : compra
    user ||--o{ orders : vende
    user ||--o| stores : tiene
    user ||--o| kyc_verifications : verifica
    user ||--o{ saved_searches : guarda
    user ||--o{ notifications : recibe
    user ||--o{ favorites : guarda
    user ||--o{ cart_items : mete
    user ||--o{ alias_history : cambia

    categories ||--o{ listings : clasifica
    listings ||--o{ listing_photos : tiene
    listings ||--o{ listing_views : registra
    listings ||--o{ order_items : aparece_en
    listings ||--o{ questions : recibe
    listings ||--o{ reports : es_reportada
    listings ||--o{ promotions : se_destaca
    listings ||--o{ favorites : es_guardada
    listings ||--o{ cart_items : es_agregada
    listings ||--o{ conversations : origina

    orders ||--|{ order_items : contiene
    orders ||--o{ order_events : audita
    orders ||--o| shipping_addresses : envia_a
    orders ||--o| pickup_codes : entrega_con
    orders ||--o{ claims : puede_tener
    orders ||--o{ ratings : califica

    conversations ||--o{ messages : contiene
    conversations ||--o{ offers : negocia
    conversations ||--o{ conversation_reads : leida_por
    conversations ||--o{ chat_reports : es_reportada

    user {
        text id PK
        text email
        text phoneNumber
        boolean phoneNumberVerified
        text alias
        text zone
        text role
        text avatar_path
        timestamptz suspended_at
    }
    listings {
        uuid id PK
        text seller_id FK
        text category FK
        text title
        integer price_cop
        text status
        text imei
        text video_path
        text poster_path
        text video_original_path
    }
    orders {
        uuid id PK
        text buyer_id FK
        text seller_id FK
        text status
        integer subtotal_cop
        integer commission_cop
        integer seller_payout_cop
        integer shipping_cop
        text delivery_method
        text provider
        text idempotency_key UK
        timestamptz delivered_at
        timestamptz released_at
    }
    order_items {
        bigint id PK
        uuid order_id FK
        uuid listing_id FK
        text title_cop
        integer price_cop
    }
    conversations {
        uuid id PK
        uuid listing_id FK
        text buyer_id FK
        text seller_id FK
    }
    messages {
        bigint id PK
        uuid conversation_id FK
        text sender_id FK
        text body "nullable desde 0013"
        ARRAY redactions
        text image_path "SOLO 0013 · no en RDS"
    }
    offers {
        uuid id PK
        uuid conversation_id FK
        uuid listing_id FK
        text offered_by FK
        integer price_cop
        text status
        timestamptz expires_at
    }
    conversation_reads {
        uuid conversation_id PK, FK
        text user_id PK, FK
        timestamptz last_read_at
    }
    chat_reports {
        bigint id PK "SOLO 0013 · no en RDS"
        uuid conversation_id FK
        text reporter_id FK
        text reason
        text detail
        timestamptz resolved_at
    }
    claims {
        uuid id PK
        uuid order_id FK
        text opened_by FK
        text kind
        text resolution
        text resolved_by FK
    }
    kyc_verifications {
        text user_id PK, FK
        text provider
        text reference
        text status
    }
    categories {
        text slug PK
        text label
        integer position
        boolean active
    }
```

## Tablas que no son del dominio

Cinco tablas las genera Better Auth o el propio sistema de migraciones, no el
modelo de negocio. Se listan aparte para no ensuciar el diagrama:

| Tabla | Origen |
|---|---|
| `account`, `session`, `verification`, `rateLimit` | esquema de Better Auth (`account.userId → user.id`, `session.userId → user.id`) |
| `migrations` | control de migraciones aplicadas |

Y otras siete del dominio que sí tienen clave foránea pero cuyos atributos no se
detallan arriba por espacio: `phone_codes`, `recovery_codes`, `otp_sends`,
`listing_photos`, `listing_views`, `user_reports`, `order_events`,
`shipping_addresses`, `pickup_codes`, `promotions`, `questions`, `ratings`,
`reports`, `saved_searches`, `favorites`, `cart_items`, `stores`,
`alias_history`, `notifications`. Todas sus relaciones sí están dibujadas o
listadas en la evidencia de claves foráneas.

## Detalle que conviene no perder

`order_items.title_cop` guarda el **título** del artículo, no un monto, pese al
sufijo `_cop` que en el resto del esquema significa «pesos colombianos». Es una
inconsistencia de nombre real y confirmada en `information_schema` (`data_type:
text`).
