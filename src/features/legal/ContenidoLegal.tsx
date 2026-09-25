import type { ReactNode } from "react";
import { TERMINOS_EN_REVISION, VERSION_TERMINOS } from "./version";

/**
 * Términos y Condiciones + Política de Tratamiento de Datos de 2venta, versión 1
 * (corrección 11 de Catalina, 2026-09-24).
 *
 * BORRADOR PARA REVISIÓN LEGAL. Lo escribió el equipo a partir de lo que la
 * aplicación hace de verdad (cada regla sale de una decisión de DECISIONS.md) y de
 * las normas que lo exigen: Ley 1480 de 2011 (arts. 47 a 53, comercio electrónico y
 * portales de contacto), Ley 1581 de 2012 y Decreto 1377 de 2013 (hoy compilado en
 * el Decreto 1074 de 2015). No lo ha aprobado un abogado. Los datos de la empresa
 * que aún no existen van marcados «POR COMPLETAR», y cada duda que el abogado debe
 * resolver va en una nota visible mientras `TERMINOS_EN_REVISION` sea verdadero.
 *
 * Cambiar este texto obliga a subir `VERSION_TERMINOS`.
 *
 * Sin estado ni efectos: lo pintan el panel (cliente) y `/legal` (servidor).
 */

export const SECCIONES = [
  { id: "quienes-somos", titulo: "1. Quiénes somos" },
  { id: "que-es", titulo: "2. Qué es 2venta" },
  { id: "cuenta", titulo: "3. Tu cuenta" },
  { id: "vender", titulo: "4. Vender" },
  { id: "comprar", titulo: "5. Comprar y pago protegido" },
  { id: "entrega", titulo: "6. Entrega" },
  { id: "reclamos", titulo: "7. Reclamos, devoluciones y retracto" },
  { id: "conducta", titulo: "8. Conversaciones y conducta" },
  { id: "cobros", titulo: "9. Qué cobra 2venta" },
  { id: "responsabilidad", titulo: "10. Responsabilidad" },
  { id: "pqr", titulo: "11. Peticiones, quejas y reclamos" },
  { id: "cambios", titulo: "12. Cambios a estos términos" },
  { id: "datos", titulo: "13. Política de tratamiento de datos personales" },
  { id: "autorizacion", titulo: "14. Tu autorización" },
] as const;

function Pendiente({ children }: { children: ReactNode }) {
  return (
    <mark className="rounded bg-warn/15 px-1 font-medium text-warn">
      {children}
    </mark>
  );
}

// Las notas para el abogado solo se ven en `/legal`: en el panel del registro
// mezclaban instrucciones internas con lo que la persona acepta (Luna). Las oculta
// el panel con la clase `nota-abogado`.
function NotaAbogado({ children }: { children: ReactNode }) {
  if (!TERMINOS_EN_REVISION) return null;
  return (
    <p className="nota-abogado mt-2 rounded-xl border border-dashed border-warn/50 bg-warn/5 px-3 py-2 text-xs text-ink2">
      <strong className="text-warn">Para revisión legal:</strong> {children}
    </p>
  );
}

function Seccion({ id, children }: { id: (typeof SECCIONES)[number]["id"]; children: ReactNode }) {
  const titulo = SECCIONES.find((s) => s.id === id)!.titulo;
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-4">
      <h3 id={`${id}-titulo`} className="font-title text-base font-semibold">
        {titulo}
      </h3>
      <div className="mt-2 flex flex-col gap-2 text-sm leading-relaxed text-ink2 [&_li]:ml-4 [&_li]:list-disc [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
        {children}
      </div>
    </section>
  );
}

export function ContenidoLegal() {
  return (
    <div className="flex flex-col gap-6">
      {TERMINOS_EN_REVISION && (
        <p
          role="note"
          className="rounded-xl bg-warn/10 px-4 py-3 text-sm font-medium text-warn"
        >
          Versión {VERSION_TERMINOS} · Borrador en revisión legal. Este texto todavía
          no lo ha aprobado un abogado.
        </p>
      )}

      <nav aria-label="Índice de los términos">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Índice</p>
        <ol className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {SECCIONES.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-brand underline">
                {s.titulo}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <h2 className="font-title text-lg font-semibold">Términos y condiciones de uso</h2>

      <Seccion id="quienes-somos">
        <p>
          2venta es operada por <Pendiente>[razón social — POR COMPLETAR]</Pendiente>,
          NIT <Pendiente>[POR COMPLETAR]</Pendiente>, con domicilio en Bogotá,
          dirección de notificaciones <Pendiente>[POR COMPLETAR]</Pendiente>, teléfono{" "}
          <Pendiente>[POR COMPLETAR]</Pendiente> y correo{" "}
          <Pendiente>[POR COMPLETAR]</Pendiente>.
        </p>
        <NotaAbogado>
          El artículo 50, literal a, de la Ley 1480 exige mostrar estos datos «en todo
          momento». Falta constituir o confirmar la sociedad y definir el correo de
          atención.
        </NotaAbogado>
      </Seccion>

      <Seccion id="que-es">
        <p>
          2venta es una plataforma para comprar y vender artículos de segunda mano en
          Bogotá. Quienes venden son personas y tiendas; 2venta no es dueña de los
          artículos ni los tiene en su poder. Lo que hace es poner en contacto a las
          partes, verificar la identidad de quien vende, guardar el pago hasta que el
          comprador recibe lo que compró y mediar si algo sale mal.
        </p>
        <NotaAbogado>
          Es un «portal de contacto» (art. 53 de la Ley 1480). Como 2venta procesa el
          pago y cobra comisión, la SIC puede considerarla parte de la relación de
          consumo y no un simple intermediario: definir el alcance de su
          responsabilidad frente al comprador.
        </NotaAbogado>
      </Seccion>

      <Seccion id="cuenta">
        <ul>
          <li>
            Para usar 2venta debes ser mayor de 18 años. Al registrarte te pedimos tu
            fecha de nacimiento para confirmarlo; no se muestra a nadie.
          </li>
          <li>
            Necesitas un correo y un celular colombiano que confirmas con un código por
            SMS. Sin celular confirmado no puedes comprar, escribir ni vender.
          </li>
          <li>
            Tu información debe ser cierta. Tu cuenta es personal: cuida tu contraseña,
            y si ves una sesión que no reconoces, ciérrala y cámbiala.
          </li>
          <li>
            Lo público de tu perfil es tu alias, tu zona aproximada, tu foto si la
            pones y tus calificaciones. Tu nombre, correo, celular y dirección no se
            muestran a nadie. Si cambias tu alias, el anterior queda registrado.
          </li>
          <li>
            2venta puede suspender una cuenta que incumpla estos términos. Suspender no
            borra nada: los pedidos, conversaciones y calificaciones se conservan, y la
            cuenta suspendida puede seguir viendo sus pedidos para defenderse en un
            reclamo, pero no puede comprar, vender ni escribir.
          </li>
        </ul>
      </Seccion>

      <Seccion id="vender">
        <ul>
          <li>
            Al empezar a vender eliges si vendes como persona o como empresa
            (persona jurídica), y nos das una dirección de notificaciones y un
            teléfono, que no se publican. Verificas tu identidad a través de un
            proveedor especializado; en una empresa, lo hace su representante legal.
            La empresa además registra su NIT, su razón social y su RUT, que revisa el
            equipo de 2venta antes de mostrarla como empresa.
          </li>
          <li>
            Cada publicación lleva un video grabado dentro de la aplicación, sin
            sonido, que prueba que tienes el artículo. El video es público: cuida que no
            salgan caras, documentos ni tu dirección. Las fotos sí pueden venir de tu
            galería.
          </li>
          <li>
            Describe el artículo tal como es: estado, detalles y defectos. En los
            celulares se pide el IMEI; en ropa, la talla, y en artículos para niños, la
            edad.
          </li>
          <li>
            El precio mínimo de publicación es de $10.000. No se permiten armas,
            sustancias prohibidas, medicamentos, animales, documentos falsos,
            imitaciones de marca ni artículos de procedencia dudosa, ni poner datos de
            contacto en la publicación.
          </li>
          <li>
            Mientras un comprador paga, el artículo queda reservado para él; si no
            termina en 30 minutos, vuelve a estar disponible.
          </li>
        </ul>
        <NotaAbogado>
          Artículo 53 de la Ley 1480: ya se guarda de cada vendedor el nombre o la
          razón social, el documento (verificación de identidad o NIT), la dirección
          de notificaciones y el teléfono. Falta definir cómo lo consulta un
          comprador que presenta una queja (hoy lo tendría que pedir al equipo).
        </NotaAbogado>
      </Seccion>

      <Seccion id="comprar">
        <ul>
          <li>
            Pagas el precio publicado (o el de una oferta que el vendedor aceptó) más el
            envío, si lo hay. Antes de pagar ves un resumen con cada artículo, su
            precio, el envío y el total.
          </li>
          <li>
            El pago lo recibe y lo guarda el proveedor de pagos, no 2venta. El dinero
            se le entrega al vendedor cuando confirmas que recibiste, cuando dictas el
            código en una entrega en persona, o siete días después de la entrega
            registrada si no hay un reclamo abierto.
          </li>
          <li>
            Un pedido de varios artículos es siempre del mismo vendedor.
          </li>
          <li>
            Nunca pagues por fuera de 2venta: si lo haces, pierdes el pago protegido y
            la mediación.
          </li>
        </ul>
        <NotaAbogado>
          Artículo 50, literal d: tras el pago debe enviarse un acuse de recibo a más
          tardar el día siguiente, con plazo de entrega, precio exacto y forma de pago.
          Hoy la confirmación se ve en el pedido y en «Avisos»; confirmar si hace falta
          por correo.
        </NotaAbogado>
      </Seccion>

      <Seccion id="entrega">
        <ul>
          <li>
            Por envío: la guía se genera desde la plataforma y la dirección solo la ven
            el vendedor, una vez pagado el pedido, y la transportadora.
          </li>
          <li>
            En persona: se elige una zona y, si la hay, un lugar público de la lista
            (centro comercial, biblioteca); el pago se hace antes en la aplicación y
            al recibir dictas un código de un solo uso. Nunca hay efectivo.
          </li>
        </ul>
      </Seccion>

      <Seccion id="reclamos">
        <ul>
          <li>
            Si lo que recibiste no coincide con lo publicado, tienes 48 horas desde la
            entrega para reclamar. Si no llegó, tienes hasta siete días.
          </li>
          <li>
            2venta decide el reclamo con la evidencia de las dos partes —cada una puede
            aportar hasta tres fotos— comparada con el video de la publicación. Mientras
            tanto el dinero sigue guardado.
          </li>
          <li>
            El costo de devolver el artículo lo paga la parte responsable. El
            arrepentimiento, por sí solo, no da derecho a devolución en una venta entre
            particulares.
          </li>
          <li>
            <strong>Retracto.</strong> Cuando quien vende es una tienda registrada con
            NIT, tienes derecho a retractarte de la compra dentro de los 5 días hábiles
            siguientes a la entrega. Se pide desde el pedido («Tengo un problema con el
            pedido») o al correo de la sección 11. Devuelves el artículo en las mismas
            condiciones en que lo recibiste y pagas el transporte de la devolución; el
            dinero se te reintegra completo, sin descuentos, en máximo 15 días
            calendario desde que ejerces el derecho y devuelves el artículo. No aplica
            a bienes de uso personal, perecederos, hechos a tu medida o que por su
            naturaleza no se puedan devolver o se deterioren rápido. Las demás
            excepciones de la ley (servicios ya empezados, precios atados al mercado
            financiero, apuestas y loterías) no corresponden a lo que se vende en
            2venta.
          </li>
          <li>
            <strong>Reversión del pago.</strong> Si pagaste con tarjeta, PSE u otro
            medio electrónico y hubo fraude, una operación que no pediste, no recibiste
            el artículo, o lo que llegó no corresponde o es defectuoso, puedes pedir que
            se reverse el pago. Dentro de los 5 días hábiles siguientes a enterarte, o
            a cuando debiste recibirlo, presenta la queja en 2venta, devuelve el
            artículo si procede y avisa al banco o emisor del medio de pago.
          </li>
        </ul>
        <NotaAbogado>
          Retracto (art. 47) y reversión (art. 51) quedaron redactados con el texto
          de la Ley 1480; el reintegro de 15 días calendario sigue el art. 47
          modificado por la Ley 2439 de 2024 (Luna, compilación de la DIAN).
          Confirmar: que el retracto aplique solo a las
          tiendas con NIT y no a las ventas entre particulares; si «uso personal»
          excluye la ropa usada; quién paga el reintegro cuando el pago ya se liberó; y
          el resto de cambios de la Ley 2439 de 2024.
        </NotaAbogado>
      </Seccion>

      <Seccion id="conducta">
        <ul>
          <li>
            Las conversaciones, ofertas y preguntas van dentro de 2venta. Los datos de
            contacto que se escriban en el chat se ocultan, para que el trato no se
            salga del pago protegido.
          </li>
          <li>
            Puedes reportar una conversación o una publicación. Cuando se reporta una
            conversación, el equipo de 2venta puede leerla para decidir.
          </li>
          <li>
            No se permite insultar, amenazar, acosar, enviar contenido sexual, estafar
            ni pedir pagos por fuera. Hacerlo puede llevar a la suspensión.
          </li>
          <li>
            Después de cada venta, comprador y vendedor pueden calificarse. Las
            calificaciones son públicas.
          </li>
        </ul>
      </Seccion>

      <Seccion id="cobros">
        <ul>
          <li>
            Comprar no tiene costo adicional al precio y el envío.
          </li>
          <li>
            Al vendedor se le descuenta una comisión del 5% del precio, con un mínimo
            de $2.500 y un máximo de $120.000 por pedido.
          </li>
          <li>
            Destacar una publicación cuesta $8.000 por siete días. Si la publicación se
            vende o se retira antes, el destacado termina y no se devuelve.
          </li>
          <li>Todos los valores son en pesos colombianos.</li>
        </ul>
        <NotaAbogado>
          Definir el tratamiento tributario (IVA sobre la comisión, facturación
          electrónica, retenciones a tiendas): es la corrección 47 de Catalina.
        </NotaAbogado>
      </Seccion>

      <Seccion id="responsabilidad">
        <p>
          Quien vende responde por lo que publica y por que el artículo sea como lo
          describió. 2venta responde por el funcionamiento de la plataforma, por
          guardar el pago y por mediar en los reclamos según estos términos. 2venta no
          garantiza que un artículo se venda ni el precio que alcance.
        </p>
        <NotaAbogado>
          Redactar los límites de responsabilidad sin contrariar el art. 50 lit. f
          (responsabilidad por la seguridad de las transacciones) ni las normas de
          orden público del Estatuto del Consumidor.
        </NotaAbogado>
      </Seccion>

      <Seccion id="pqr">
        <p>
          Puedes presentar peticiones, quejas y reclamos desde tu pedido («Tengo un problema con el
          pedido») o al correo <Pendiente>[POR COMPLETAR]</Pendiente>. Cada
          radicación queda con fecha y hora y puedes seguirla.
        </p>
        <p>
          La autoridad de protección al consumidor en Colombia es la Superintendencia
          de Industria y Comercio:{" "}
          <a
            href="https://www.sic.gov.co"
            target="_blank"
            rel="noreferrer"
            className="text-brand underline"
          >
            www.sic.gov.co
          </a>
          .
        </p>
        <NotaAbogado>
          El parágrafo del art. 50 pide un enlace a la SIC «visible y fácilmente
          identificable» en el sitio, no solo aquí: falta ubicarlo en la navegación.
        </NotaAbogado>
      </Seccion>

      <Seccion id="cambios">
        <p>
          Si estos términos cambian, publicaremos la nueva versión y te pediremos que
          la aceptes antes de seguir usando 2venta. Guardamos qué versión aceptaste y
          cuándo. Estos términos se rigen por la ley colombiana.
        </p>
      </Seccion>

      <h2 className="mt-2 font-title text-lg font-semibold">
        Política de tratamiento de datos personales
      </h2>

      <Seccion id="datos">
        <p>
          <strong>Responsable.</strong> <Pendiente>[razón social — POR COMPLETAR]</Pendiente>,
          con los datos de contacto de la sección 1. El área que atiende las
          consultas y reclamos sobre datos personales es el equipo de Atención al
          usuario de 2venta, en <Pendiente>[correo — POR COMPLETAR]</Pendiente>.
        </p>

        <p><strong>Qué datos tratamos y para qué.</strong></p>
        <ul>
          <li>
            <strong>Registro:</strong> nombre, correo, celular, fecha de nacimiento, alias y contraseña
            (guardada como un hash que no se puede revertir, nunca en texto). Para crear tu cuenta, confirmar que el
            celular es tuyo y evitar cuentas falsas.
          </li>
          <li>
            <strong>Perfil:</strong> zona, foto y calificaciones. Para mostrar a los
            demás la cercanía y la reputación.
          </li>
          <li>
            <strong>Ubicación aproximada:</strong> de quien vende, el centro de su zona o,
            si usa «Usar mi ubicación», un punto de su celular redondeado a cerca de 1 km;
            nunca el punto exacto ni la dirección. Con él mostramos a cuántos kilómetros
            está cada artículo, también redondeado. De quien compra, la zona o el punto
            que elija (también a 1 km) queda solo en una cookie de su navegador, no en
            nuestra base, y se borra con «Quitar». El permiso de ubicación del celular es
            opcional: sin él se elige la zona de una lista.
          </li>
          <li>
            <strong>Vendedores:</strong> si vendes como persona o empresa, tu dirección
            de notificaciones y un teléfono de contacto (la ley los exige y no se
            publican). La verificación de identidad la hace un proveedor
            especializado; 2venta guarda el resultado y la referencia. De las
            empresas, el NIT, la razón social, el nombre y la cédula del representante
            legal y el RUT, que solo ve el equipo.
          </li>
          <li>
            <strong>Publicaciones:</strong> video (sin sonido), fotos, descripción y,
            en celulares, el IMEI. Para mostrar el artículo y prevenir la venta de
            equipos robados.
          </li>
          <li>
            <strong>Pedidos:</strong> nombre y celular de quien recibe y la dirección
            de entrega, que solo ven el vendedor después del pago y la transportadora.
            Los datos de tu tarjeta o cuenta los maneja el proveedor de pagos; 2venta
            no los guarda.
          </li>
          <li>
            <strong>Conversaciones, ofertas, reclamos y sus fotos:</strong> para que el
            trato quede registrado y poder resolver un reclamo.
          </li>
          <li>
            <strong>Datos técnicos:</strong> la dirección IP y el navegador de cada
            sesión, para que puedas ver y cerrar tus sesiones; las visitas a las
            publicaciones, para las métricas del vendedor. En tu navegador guardamos
            temporalmente el recorrido para el botón «Volver» y los datos de entrega
            mientras terminas una compra; no usamos cookies de publicidad.
          </li>
        </ul>

        <p>
          <strong>Datos sensibles.</strong> La verificación de identidad de quien
          vende puede incluir una foto de tu rostro, que es un dato biométrico y por
          eso sensible. No es obligatorio entregarlo: solo se pide si quieres vender, y
          antes de empezar la verificación te pedimos una autorización aparte, que
          queda registrada con su fecha. No tratamos datos de menores de edad.
        </p>
        <NotaAbogado>
          Confirmar qué datos biométricos recibe o conserva el proveedor de identidad
          que se contrate. La autorización explícita (art. 6 de la Ley 1581) ya se pide
          en `/vender` antes de empezar la verificación: revisar su redacción.
        </NotaAbogado>

        <p>
          <strong>Con quién los compartimos.</strong> Solo con quienes nos ayudan a
          prestar el servicio y en lo necesario: el proveedor de pagos, el de SMS, el
          de verificación de identidad, la transportadora, Google (si entras con tu
          cuenta de Google) y Amazon Web Services, donde se alojan los datos. También
          con autoridades que los pidan legalmente.
        </p>
        <NotaAbogado>
          Amazon Web Services aloja los datos fuera de Colombia: es una transferencia
          o transmisión internacional (art. 26 de la Ley 1581). Revisar si hace falta
          declaración de conformidad o contrato de transmisión, y si 2venta debe
          inscribirse en el Registro Nacional de Bases de Datos de la SIC.
        </NotaAbogado>

        <p><strong>Tus derechos.</strong> Como titular puedes:</p>
        <ul>
          <li>Conocer, actualizar y rectificar tus datos.</li>
          <li>Pedir prueba de la autorización que nos diste.</li>
          <li>Saber, si lo pides, qué uso le hemos dado a tus datos.</li>
          <li>
            Presentar quejas ante la Superintendencia de Industria y Comercio.
          </li>
          <li>
            Revocar la autorización o pedir que borremos tus datos, salvo cuando la
            ley o un contrato vigente nos obliguen a conservarlos.
          </li>
          <li>Acceder gratis a tus datos.</li>
        </ul>

        <p>
          <strong>Cómo ejercerlos.</strong> Escribe a{" "}
          <Pendiente>[correo — POR COMPLETAR]</Pendiente> desde el correo de tu cuenta,
          con tu nombre, tu celular registrado, qué pides (conocer, actualizar,
          rectificar, suprimir o revocar) y, si es un reclamo, los hechos y los
          documentos que lo respalden. Las consultas se responden en máximo 10 días
          hábiles (5 más si hace falta, avisándote antes). Los reclamos, en máximo 15
          días hábiles (8 más si hace falta); si al reclamo le falta información, te la
          pedimos en los 5 días siguientes, y si no la envías en 2 meses se entiende
          que desististe.
        </p>
        <p>
          <strong>Qué no se puede borrar.</strong> Los pedidos, pagos, reclamos y
          conversaciones de una compra se conservan aunque cierres la cuenta: son la
          prueba de la relación comercial que la ley nos obliga a guardar, y protegen a
          la otra parte.
        </p>
        <NotaAbogado>
          Definir el plazo de conservación (art. 50 lit. e de la Ley 1480: «por el
          mismo tiempo que se deben guardar los documentos de comercio») y la fecha de
          entrada en vigencia de esta política (art. 13 del Decreto 1377).
        </NotaAbogado>
        <p>
          <strong>Seguridad.</strong> Las contraseñas se guardan como un hash que no se
          puede revertir y los códigos de verificación van cifrados; la conexión va
          cifrada y el acceso a los datos está
          restringido a quien lo necesita.
        </p>
        <p>
          <strong>Vigencia.</strong> Versión {VERSION_TERMINOS}. Entra en vigencia el{" "}
          <Pendiente>[fecha de aprobación — POR COMPLETAR]</Pendiente>. Las bases de
          datos de 2venta estarán vigentes mientras la plataforma opere y, después, el
          tiempo que la ley obligue a conservar la información.
        </p>
      </Seccion>

      <Seccion id="autorizacion">
        <p>
          Al tocar «Aceptar» declaras que tienes 18 años o más, que leíste estos
          Términos y Condiciones y la Política de tratamiento de datos personales
          (versión {VERSION_TERMINOS}), y autorizas de forma previa, expresa e
          informada a 2venta a tratar tus datos personales para las finalidades
          descritas aquí.
        </p>
      </Seccion>
    </div>
  );
}
