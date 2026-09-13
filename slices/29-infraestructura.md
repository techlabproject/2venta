# Rebanada S-29 — Infraestructura como código y primer despliegue

La sección 5 de `ARQUITECTURA.md`, hecha Terraform, y el flujo de entrega de la
sección 5.8.

## Qué hace

- `infra/` describe todo lo que existe en AWS. Nada se crea a mano en la consola.
  - `infra/cuenta/`: lo que hay una sola vez por cuenta: el repositorio de
    imágenes (ECR), el proveedor OIDC de GitHub y el rol que usa el flujo de
    despliegue.
  - `infra/modules/entorno/`: un entorno completo. `dev` y `prod` son dos
    instancias del mismo módulo con variables distintas (D-53).
  - `infra/envs/dev/`, `infra/envs/prod/`: las variables de cada uno.
- El primer despliegue real: `dev`, con la imagen de S-26 corriendo la web y el
  worker, migraciones aplicadas, y una compra completa hecha contra la nube.
- GitHub Actions: `verificar.yml` corre `npm run verify` en cada push;
  `desplegar-dev.yml` construye la imagen, la sube a ECR, corre las migraciones
  como tarea aparte y aplica Terraform con la etiqueta nueva. Autenticado con
  OIDC, sin llaves guardadas en el repositorio.

## Lo que no hizo falta cambiar

`BETTER_AUTH_URL` sale de la distribución de CloudFront, que Terraform crea
antes que la definición de tarea (el ALB no depende de ECS), así que no hay
huevo y gallina ni segunda pasada.

## La decisión que cambió respecto al estudio

App Runner (D-55) sigue en `SubscriptionRequired` en la cuenta, que es nueva, y no
hay forma de saber cuándo se activa. En vez de esperar, se va directo al destino
que el estudio ya fijaba: **ECS Fargate detrás de un ALB, con CloudFront delante**
(D-49, §5.1, §5.6). CloudFront resuelve lo que App Runner iba a resolver, el HTTPS
sin dominio: entrega un certificado propio en `*.cloudfront.net`. El ALB solo
acepta tráfico desde CloudFront (lista de prefijos administrada) y solo por HTTP;
el cifrado con el usuario lo hace CloudFront.

## Qué es distinto entre `dev` y `prod`

| | `dev` | `prod` |
|---|---|---|
| Tareas de ECS | en subredes públicas con IP pública, sin NAT (≈ 0 USD) | en subredes privadas, NAT y endpoints de VPC (§5.6) |
| RDS | `db.t4g.micro`, una zona, 7 días de respaldo | `db.t4g.small`, Multi-AZ, 14 días |
| Tareas web | 1 × 0,25 vCPU / 0,5 GB | 2 × 0,5 vCPU / 1 GB, en dos zonas |
| `APP_ENV` | `desarrollo`: proveedores de prueba, puentes `/api/dev/*` | `produccion` |
| WAF | no | sí |

La única diferencia que toca seguridad real es la de subredes: en `dev` las tareas
tienen IP pública para no pagar NAT ni cinco endpoints de interfaz. Sus grupos de
seguridad no admiten nada de entrada salvo el ALB hacia la web. RDS está en
privadas en los dos entornos y no es accesible desde fuera de la VPC.

**`prod` se define pero no se aplica todavía.** Sin proveedor de SMS la
aplicación se niega a arrancar en `produccion` (D-47), así que aplicarlo hoy
sería pagar ~170 USD/mes por un servicio que no puede recibir a nadie.

## Secretos

Un secreto de Secrets Manager por entorno con todas las claves en JSON; ECS
inyecta cada una como variable. Los seis secretos de firma y cifrado los genera
Terraform (`random_password`) una sola vez. `PHONE_CODE_SECRET` y
`PICKUP_CODE_SECRET` no se regeneran nunca (D-52): no tienen `keepers`, y el
estado los conserva. `DATABASE_URL` se arma con la contraseña generada y el
endpoint de RDS.

El estado de Terraform contiene esas contraseñas. Vive en un bucket privado,
versionado y cifrado, con bloqueo de estado. Es aceptable para un MVP y hay que
saberlo: quien lea el estado lee los secretos.

## Archivos que toca

- `infra/**` — nuevo.
- `.github/workflows/verificar.yml`, `desplegar-dev.yml` — nuevos.
- `Dockerfile` — la CA de RDS, para que la conexión verifique el certificado
  (`sslmode=verify-full`).
- `CLAUDE.md`, `ARQUITECTURA.md` — cómo se despliega; la decisión de App Runner.

## Explícitamente fuera

- Dominio propio, ACM y Route 53. Cuando exista.
- Transcodificación con MediaConvert. Rebanada propia.
- SES, SMS, Mercado Pago, KYC, transportadora: siguen esperando R-02/R-04.
- Aplicar `prod`.

## Prueba de punta a punta

1. `terraform apply` de `dev` termina sin errores y sin nada creado a mano.
2. La imagen llega a ECR, la tarea de migración aplica las 7 migraciones, la web
   responde `200` en `/api/salud` desde CloudFront y el worker está escuchando
   (registro en CloudWatch).
3. Contra la dirección pública: registro con celular (el código sale en el
   registro de CloudWatch porque `APP_ENV=desarrollo`), verificación de
   identidad de prueba, publicación con video subido directo a S3, y una compra
   con el proveedor de pagos de prueba.
4. `EventBridge Scheduler` está programado cada hora hacia la cola y el worker
   procesa un `liberar` encolado a mano.

## Casos de fallo con prueba

- RDS no responde a una conexión desde fuera de la VPC.
- El ALB responde 403 a una petición directa que no venga de CloudFront.
- Un `PUT` al bucket sin firma es rechazado.

## Depende de

S-28.
