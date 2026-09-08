/**
 * Cuántas fotos se admiten (RF-15).
 *
 * Seis es suficiente para mostrar un artículo por todos lados y poco para que a
 * nadie se le ocurra usar la ficha como álbum.
 *
 * Este archivo NO importa nada del servidor a propósito: lo usa el formulario, que
 * es un componente de cliente, y cualquier import que llegue hasta la base de datos
 * arrastra el cliente de Postgres al navegador y rompe la aplicación entera.
 */
export const MAX_PHOTOS = 6;
