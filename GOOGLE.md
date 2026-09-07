# Entrar con Google

El código ya está. Falta pegarle las credenciales, que solo puedes sacar tú porque
salen de tu cuenta de Google.

## Sacar las credenciales

1. Entra a la consola de Google Cloud y crea un proyecto (o usa uno existente).
2. Busca "APIs y servicios" → "Pantalla de consentimiento de OAuth". Configúrala
   como **externa**, con el nombre 2venta y tu correo de contacto.
3. En "Credenciales" → "Crear credenciales" → **ID de cliente de OAuth**, tipo
   **Aplicación web**.
4. En **URI de redireccionamiento autorizados**, agrega exactamente:

   ```
   http://localhost:3000/api/auth/callback/google
   ```

   Y cuando haya dominio de verdad, agrega también el de producción con la misma
   forma: `https://TU-DOMINIO/api/auth/callback/google`.

5. Copia el identificador y el secreto.

## Pegarlas

En `.env.local`:

```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Reinicia el servidor. El botón aparece solo cuando las dos variables existen: sin
ellas el proveedor ni siquiera se registra, así que la app no se rompe por no
tenerlas.

## Un detalle que no es obvio

**Entrar con Google no exime del celular verificado.** Google entrega el correo,
no el número, y la D-01 dice que sin celular confirmado no se compra ni se escribe.
Así que después de volver de Google la app pide el celular y manda el código.

Sin ese paso, cualquiera podría estafar y volver a entrar con otra cuenta de Google
en dos minutos, que es exactamente lo que la decisión existe para impedir.

## Si el puerto no es el 3000

Docker ocupa el 3000 en esta máquina, así que el servidor arranca en otro. Google
exige que la URI de redireccionamiento coincida **exacta**, puerto incluido. Dos
salidas: agregar también la URI del puerto que estés usando, o liberar el 3000.
