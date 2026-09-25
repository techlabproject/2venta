# Infraestructura

Todo lo que existe en AWS está descrito aquí. Nada se crea a mano en la consola.
El estudio que lo sostiene es `ARQUITECTURA.md`; esta carpeta es su forma en
Terraform.

```
infra/
  cuenta/            una vez por cuenta: ECR, OIDC de GitHub, rol de despliegue
  modules/entorno/   un entorno completo (red, base, bucket, cola, ECS, CloudFront)
  envs/dev/          dev = módulo entorno con variables baratas
  envs/prod/         prod = el mismo módulo con Multi-AZ, NAT, WAF (definido, sin aplicar)
```

El estado vive en el bucket `2venta-terraform-681842289811` (privado, versionado,
cifrado), una clave por carpeta. Lo creó a mano `aws s3api create-bucket` antes
de que existiera Terraform; es la única excepción.

## Comandos

```bash
cd infra/envs/dev
terraform init
terraform plan -var image_tag=<etiqueta en ECR>
terraform apply -var image_tag=<etiqueta en ECR>
```

`image_tag` no tiene valor por defecto a propósito: cada `apply` dice qué imagen
despliega. El flujo de GitHub Actions la pasa; a mano se pasa la que se quiera.

## Lo que hay que saber

- **El estado contiene los secretos** (contraseña de RDS, secretos de firma).
  Quien pueda leer el bucket de estado los lee. Aceptable para un MVP; no
  ampliar quién tiene acceso al bucket sin pensarlo.
- `PHONE_CODE_SECRET` y `PICKUP_CODE_SECRET` no se regeneran nunca (D-52). Si
  alguna vez se destruye el secreto de Secrets Manager, los códigos de entrega
  guardados quedan ilegibles.
- Las migraciones corren como tarea aparte (`node db/migrate.mts`), antes de
  actualizar los servicios. Nunca al arrancar el contenedor.
- En `dev` las tareas tienen IP pública para no pagar NAT. Sus grupos de seguridad
  no admiten nada de entrada salvo el ALB hacia la web.

## WhatsApp para los códigos de verificación (D-117)

El token de Meta y el secreto de la app **no pasan por Terraform ni por el
repositorio**. Terraform crea el secreto vacío y una persona lo llena.

1. Con `whatsapp_secreto = true` (ya está en `envs/dev/main.tf`), el despliegue crea
   el secreto `2venta-dev/whatsapp`, vacío.
2. Llenarlo con el token permanente del usuario de sistema y el secreto de la app:

   ```bash
   AWS_PROFILE=2venta aws secretsmanager put-secret-value \
     --secret-id 2venta-dev/whatsapp \
     --secret-string file://whatsapp.json
   ```

   con `whatsapp.json` (fuera del repositorio, y se borra después) así:
   `{"WHATSAPP_TOKEN":"…","WHATSAPP_APP_SECRET":"…"}`.
3. Descomentar `whatsapp_phone_number_id` en `envs/dev/main.tf` y hacer push: las
   tareas arrancan con `WHATSAPP_TOKEN`, `WHATSAPP_APP_SECRET` y
   `WHATSAPP_PHONE_NUMBER_ID`. Si el secreto sigue vacío en este paso, las tareas
   **no arrancan**: por eso va después del 2.
4. En Meta (WhatsApp → Configuración → Webhook):
   - URL: `https://d13g2bd9j8wj8k.cloudfront.net/api/whatsapp/webhook`
   - Token de verificación: la clave `WHATSAPP_VERIFY_TOKEN` del secreto `2venta-dev/app`
     (la genera Terraform):
     `AWS_PROFILE=2venta aws secretsmanager get-secret-value --secret-id 2venta-dev/app --query SecretString --output text | jq -r .WHATSAPP_VERIFY_TOKEN`
   - Suscribirse al campo `messages` (trae los estados de entrega).

En `dev` el código se sigue escribiendo también en el registro (la prueba de humo lo
lee de ahí); en `prod` solo sale por WhatsApp.
