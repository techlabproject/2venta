// Límites del reclamo que necesitan saber el navegador y el servidor a la vez.
//
// Vive aparte y sin importar nada: `queries.ts` llega a `src/lib/db.ts`, y un
// componente de cliente que lo importe —aunque solo sea por un número— se arrastra
// el cliente de Postgres al navegador y rompe la aplicación entera, con un error
// que solo aparece en el registro del servidor.

/** Cuántas fotos de prueba puede aportar cada parte a un reclamo (S-39). */
export const MAX_PRUEBAS = 3;
