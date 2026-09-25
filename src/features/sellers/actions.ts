"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { clienteActivo } from "@/lib/session";
import { query } from "@/lib/db";
import { kycProvider } from "@/features/kyc/provider";
import { startVerification } from "@/features/kyc/queries";
import { formatNit, isValidNit } from "@/features/store/nit";
import { CONTACT_REJECTED, hasContact } from "@/features/chat/redact";
import { problemaDeDireccion, RUT_MAX_BYTES, telefonoValido } from "./reglas";

export type VendedorResult = { error: string };

/**
 * Empezar a vender (corrección 15, decisiones de Nicolás): se elige persona natural
 * o jurídica, se guardan los datos que exige el art. 53 y se arranca la
 * verificación de identidad (de la persona, o del representante legal).
 *
 * Todo se valida aquí: la pantalla ayuda, pero no controla nada.
 */
export async function empezarComoVendedor(
  _prev: VendedorResult | null,
  form: FormData,
): Promise<VendedorResult> {
  const user = await clienteActivo();
  // D-01: sin celular confirmado no hay nada más.
  if (!user.phoneNumberVerified) redirect("/verificar");

  const tipo = String(form.get("tipo") ?? "");
  if (tipo !== "natural" && tipo !== "juridica") {
    return { error: "Elige si vendes como persona o como empresa." };
  }

  const direccion = String(form.get("direccion") ?? "").trim().slice(0, 200);
  const problema = problemaDeDireccion(direccion);
  if (problema) return { error: problema };
  const telefono = telefonoValido(String(form.get("telefono") ?? ""));
  if (!telefono) {
    return { error: "El teléfono de contacto debe ser un celular (300 412 8805) o un fijo con indicativo (601 234 5678)." };
  }

  let juridica: {
    legalName: string;
    nit: string;
    repNombre: string;
    repCedula: string;
    rut: Buffer;
  } | null = null;

  if (tipo === "juridica") {
    const legalName = String(form.get("legalName") ?? "").trim().slice(0, 200);
    if (legalName.length < 3) return { error: "Escribe la razón social de la empresa." };
    // La razón social se muestra en lugar del alias: mismo listón (D-66).
    if (hasContact(legalName)) {
      return { error: `La razón social ${CONTACT_REJECTED.charAt(0).toLowerCase()}${CONTACT_REJECTED.slice(1)}` };
    }
    const rawNit = String(form.get("nit") ?? "");
    if (!isValidNit(rawNit)) {
      return { error: "Ese NIT no es válido. Revisa el número y el dígito de verificación." };
    }
    const repNombre = String(form.get("repNombre") ?? "").trim().slice(0, 120);
    if (repNombre.length < 3) return { error: "Escribe el nombre del representante legal." };
    const repCedula = String(form.get("repCedula") ?? "").replace(/\D/g, "");
    if (!/^\d{6,10}$/.test(repCedula)) {
      return { error: "La cédula del representante legal son entre 6 y 10 dígitos." };
    }
    const archivo = form.get("rut");
    if (!(archivo instanceof File) || archivo.size === 0) {
      return { error: "Adjunta el RUT de la empresa en PDF." };
    }
    if (archivo.size > RUT_MAX_BYTES) return { error: "El RUT pesa demasiado. El máximo son 2 MB." };
    const bytes = Buffer.from(await archivo.arrayBuffer());
    // El tipo que declara el navegador no se cree: un PDF empieza por «%PDF».
    if (bytes.subarray(0, 4).toString("latin1") !== "%PDF") {
      return { error: "El RUT tiene que ser un PDF." };
    }
    juridica = { legalName, nit: formatNit(rawNit), repNombre, repCedula, rut: bytes };
  }

  // Art. 6 de la Ley 1581: autorización explícita para la selfie (corrección 11).
  if (form.get("autorizoBiometricos") !== "si") {
    return { error: "Para verificar la identidad necesitamos la autorización para la foto del rostro." };
  }

  if (juridica) {
    try {
      await query(
        `insert into stores (user_id, legal_name, nit, representante_nombre, representante_cedula, rut_pdf)
         values ($1, $2, $3, $4, $5, $6)
         on conflict (user_id) do update
           set legal_name = excluded.legal_name,
               nit = excluded.nit,
               representante_nombre = excluded.representante_nombre,
               representante_cedula = excluded.representante_cedula,
               rut_pdf = excluded.rut_pdf,
               nit_confirmado_at = null,
               archivada_at = null`,
        [user.id, juridica.legalName, juridica.nit, juridica.repNombre, juridica.repCedula, juridica.rut],
      );
    } catch (err) {
      if (err instanceof Error && /stores_nit_vigente/.test(err.message)) {
        return { error: "Ese NIT ya está registrado en otra cuenta." };
      }
      throw err;
    }
  } else {
    // Quien pasa a persona natural deja de ser empresa: se archiva, no se borra.
    await query(
      `update stores set archivada_at = now() where user_id = $1 and archivada_at is null`,
      [user.id],
    );
  }

  // Después de la empresa y no antes: si el NIT estaba repetido, no queda guardado
  // nada a medias que dejara a la persona sin poder corregir (Luna, fila 15).
  await query(
    `insert into vendedores (user_id, tipo, direccion_notificaciones, telefono)
     values ($1, $2, $3, $4)
     on conflict (user_id) do update
       set tipo = excluded.tipo,
           direccion_notificaciones = excluded.direccion_notificaciones,
           telefono = excluded.telefono,
           updated_at = now()`,
    [user.id, tipo, direccion, telefono],
  );

  const { reference, redirectUrl } = await kycProvider.start(user.id);
  await startVerification(user.id, kycProvider.name, reference);
  revalidatePath("/vender");
  redirect(redirectUrl);
}

/** Quien ya vendía antes de la corrección 15 completa su dirección y teléfono. */
export async function completarDatosVendedor(
  _prev: VendedorResult | null,
  form: FormData,
): Promise<VendedorResult> {
  const user = await clienteActivo();
  const direccion = String(form.get("direccion") ?? "").trim().slice(0, 200);
  const problema = problemaDeDireccion(direccion);
  if (problema) return { error: problema };
  const telefono = telefonoValido(String(form.get("telefono") ?? ""));
  if (!telefono) {
    return { error: "El teléfono de contacto debe ser un celular (300 412 8805) o un fijo con indicativo (601 234 5678)." };
  }
  await query(
    `insert into vendedores (user_id, tipo, direccion_notificaciones, telefono)
     values ($1, 'natural', $2, $3)
     on conflict (user_id) do update
       set direccion_notificaciones = excluded.direccion_notificaciones,
           telefono = excluded.telefono,
           updated_at = now()`,
    [user.id, direccion, telefono],
  );
  revalidatePath("/vender");
  return { error: "" };
}
