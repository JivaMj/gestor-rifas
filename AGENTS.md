# AGENTS.md

## 1. Descripción del proyecto

Construir una aplicación web de micro-rifas.

La aplicación permite crear y administrar rifas digitales de manera sencilla. Cada rifa tiene una página pública donde los participantes pueden consultar los números disponibles y seleccionar uno. La comunicación y el pago se realizan externamente mediante WhatsApp.

La aplicación debe ser deliberadamente simple, económica y fácil de desplegar.

No se debe introducir una arquitectura de frontend/backend desacoplados salvo que exista una necesidad técnica real.

---

## 2. Objetivo principal

La aplicación debe permitir:

1. Crear una rifa.
2. Configurar el premio.
3. Agregar características/descripción del premio.
4. Subir opcionalmente una imagen del premio.
5. Definir fecha de la rifa.
6. Definir términos y condiciones.
7. Definir rango de números.
8. Definir precio del boleto.
9. Definir número de WhatsApp del organizador.
10. Generar automáticamente una URL pública para la rifa.
11. Mostrar números disponibles y ocupados.
12. Permitir que un participante seleccione un número.
13. Redirigir al participante a WhatsApp con la información de la rifa y el número seleccionado.
14. Permitir al organizador marcar números como vendidos/reservados.
15. Determinar el número ganador mediante:

    * selección aleatoria dentro de los números vendidos;
    * introducción manual del número ganador.
16. Registrar cómo se determinó el ganador.
17. Permitir administrar múltiples rifas.
18. Proteger la creación y administración mediante códigos.

---

# 3. Arquitectura

## Stack obligatorio

* Next.js
* React
* TypeScript
* Supabase
* PostgreSQL
* Supabase Storage para imágenes
* Vercel para despliegue

Utilizar App Router.

Utilizar Server Actions y/o Route Handlers de Next.js cuando sea necesario.

No crear un backend Express separado.

No crear un frontend separado.

No utilizar una arquitectura de microservicios.

No utilizar Docker salvo que exista una necesidad real.

---

# 4. Filosofía del proyecto

Este es un MVP.

La prioridad es:

1. simplicidad;
2. seguridad razonable;
3. facilidad de mantenimiento;
4. bajo costo;
5. buena experiencia móvil;
6. evitar infraestructura innecesaria.

No sobreingenierizar.

No crear abstracciones innecesarias.

No crear capas solamente por cumplir patrones arquitectónicos.

Utilizar TypeScript estrictamente.

Evitar `any`.

Mantener los componentes pequeños y reutilizables.

---

# 5. Concepto de acceso

La aplicación NO debe depender inicialmente de un sistema tradicional de usuarios, contraseñas y registro.

Existen dos niveles de acceso:

## 5.1 Código maestro

Existe un código maestro de administración.

Este código permite acceder al panel general de gestión.

El código maestro NO debe estar hardcodeado en componentes del frontend.

Debe almacenarse como variable de entorno segura o utilizarse mediante un mecanismo seguro de autenticación.

Variable inicial sugerida:

```env
MASTER_ADMIN_CODE=
```

Nunca exponer esta variable al cliente.

No utilizar:

```env
NEXT_PUBLIC_MASTER_ADMIN_CODE=
```

---

## 5.2 Código de rifa

Cada rifa debe tener un código único de administración.

Ejemplo:

```text
RIFA-X7K29P
```

o una cadena aleatoria segura.

Este código permite administrar únicamente esa rifa.

El código debe ser generado automáticamente al crear la rifa.

Debe almacenarse en la base de datos de forma segura.

No mostrar códigos de otras rifas a un administrador de una rifa.

---

# 6. Flujo de administración

## Acceso al panel

Ruta:

```text
/admin
```

Debe solicitar:

```text
Código de administración
```

Si el código maestro es válido:

```text
/admin/rifas
```

Mostrar las rifas existentes.

Desde aquí se puede:

* crear una rifa;
* consultar rifas;
* acceder a la administración de una rifa.

---

# 7. Creación de una rifa

Formulario:

```text
Premio
Descripción / características
Imagen opcional
Fecha de la rifa
Términos y condiciones
Número inicial
Número final
Precio del boleto
WhatsApp
Método de determinación del ganador
```

Al crear:

1. validar los datos;
2. generar un identificador;
3. generar un slug;
4. generar un código privado de administración;
5. guardar la información;
6. permitir subir la imagen si existe;
7. mostrar la URL pública;
8. mostrar el código privado de administración.

Ejemplo:

```text
Rifa creada correctamente.

URL pública:
rifas.example.com/r/iphone-17-pro

Código de administración:
RIFA-X7K29P
```

El código privado debe mostrarse de forma clara y advertir al usuario que debe conservarlo.

---

# 8. Modelo de datos

Utilizar PostgreSQL mediante Supabase.

## Tabla `raffles`

Campos recomendados:

```text
id
slug
title
description
prize_image_url
raffle_date
terms
number_from
number_to
ticket_price
whatsapp
winner_method
winner_number
winner_source
admin_code_hash
status
created_at
updated_at
```

`winner_method`:

```text
random
manual
```

`status`:

```text
active
finished
cancelled
```

No guardar el código de administración en texto plano si puede evitarse.

Guardar un hash y comparar mediante una función segura del lado servidor.

---

# 9. Números de rifa

No es obligatorio crear una fila por cada número.

La aplicación debe poder representar un rango:

```text
00 - 99
```

o:

```text
1 - 1000
```

sin necesidad de generar inicialmente miles de registros.

Los números utilizados/vendidos/reservados sí pueden almacenarse.

Tabla recomendada:

## `tickets`

```text
id
raffle_id
number
status
created_at
updated_at
```

Estados:

```text
available
reserved
sold
```

Debe existir una restricción única:

```text
raffle_id + number
```

para impedir que el mismo número sea asignado dos veces.

---

# 10. Reserva y venta

La selección del número en la página pública NO significa que el boleto ya esté vendido.

Flujo:

```text
Participante
    ↓
Selecciona número
    ↓
Visualiza confirmación
    ↓
Presiona "Continuar por WhatsApp"
    ↓
WhatsApp
    ↓
Realiza el pago por fuera
    ↓
Organizador confirma
    ↓
Número pasa a SOLD
```

El sistema debe evitar condiciones de carrera.

Dos usuarios no pueden terminar con el mismo número vendido.

La asignación definitiva debe validarse en el servidor.

No confiar en validaciones únicamente del cliente.

---

# 11. WhatsApp

La página pública debe generar un enlace hacia WhatsApp.

El mensaje debe incluir como mínimo:

```text
Hola, quiero participar en la rifa de [PREMIO].

Número seleccionado: [NUMERO]

Precio: [PRECIO]
```

El número de WhatsApp debe proceder de la configuración de la rifa.

No utilizar un número global hardcodeado.

---

# 12. Página pública

Ruta:

```text
/r/[slug]
```

Debe estar optimizada principalmente para móviles.

Debe mostrar:

* premio;
* imagen;
* descripción;
* fecha;
* precio;
* rango de números;
* números disponibles;
* números vendidos;
* términos y condiciones;
* WhatsApp;
* estado de la rifa.

Diseño:

* moderno;
* limpio;
* sobrio;
* visualmente atractivo;
* buena jerarquía;
* responsive;
* sin apariencia de dashboard corporativo;
* pensado para compartir por WhatsApp.

---

# 13. Selector de números

Mostrar una cuadrícula.

Ejemplo:

```text
01  02  03  04  05
06  07  08  09  10
11  12  13  14  15
...
```

Estados visuales:

```text
Disponible
Seleccionado
Vendido
Reservado
```

Los números vendidos no deben poder seleccionarse.

Debe existir feedback visual claro.

En móviles, la interacción debe ser cómoda.

---

# 14. Administración de una rifa

Ruta conceptual:

```text
/admin/rifa/[id]
```

El acceso requiere el código privado correspondiente a esa rifa.

El administrador debe poder:

* ver información de la rifa;
* editar información;
* cambiar imagen;
* ver números;
* reservar números;
* marcar números como vendidos;
* liberar reservas;
* buscar números;
* seleccionar ganador;
* finalizar la rifa.

---

# 15. Determinación del ganador

Existen dos métodos.

## Método random

El sistema debe seleccionar aleatoriamente un número entre los números vendidos.

IMPORTANTE:

No seleccionar simplemente cualquier número del rango.

El ganador debe salir de los números efectivamente vendidos.

Ejemplo:

```text
Vendidos:
04
17
32
48
77
```

El random puede seleccionar únicamente:

```text
04, 17, 32, 48, 77
```

Nunca:

```text
01
15
99
```

si no fueron vendidos.

Guardar:

```text
winner_method = random
winner_number = 32
```

---

## Método manual

El administrador introduce:

```text
Número ganador
Fuente / referencia
```

Ejemplo:

```text
Número ganador: 32

Fuente:
Resultado de la Lotería X
30/09/2026
```

Guardar:

```text
winner_method = manual
winner_number = 32
winner_source = "Resultado de la Lotería X - 30/09/2026"
```

El número manual debe validarse.

Si el método requiere un número vendido, verificar que exista.

---

# 16. Seguridad

Nunca confiar en datos enviados desde el cliente.

Las siguientes operaciones deben validarse en servidor:

* creación de rifa;
* modificación;
* reserva;
* venta;
* liberación;
* selección del ganador;
* finalización.

Nunca exponer:

```text
SUPABASE_SERVICE_ROLE_KEY
MASTER_ADMIN_CODE
```

al navegador.

Utilizar solamente variables de entorno server-side.

No utilizar `NEXT_PUBLIC_` para secretos.

---

# 17. Supabase

Usar Supabase como:

* PostgreSQL;
* Storage;
* opcionalmente funcionalidades de autenticación si posteriormente se necesitan.

La aplicación debe utilizar el cliente apropiado según el contexto:

* cliente público para operaciones permitidas;
* cliente server-side para operaciones administrativas.

Configurar Row Level Security cuando corresponda.

No desactivar RLS como solución rápida sin entender las consecuencias.

---

# 18. Imágenes

Las imágenes de premios son opcionales.

Utilizar Supabase Storage.

Bucket sugerido:

```text
raffle-images
```

No almacenar imágenes grandes como Base64 en PostgreSQL.

Almacenar solamente la URL o referencia necesaria.

Comprimir/redimensionar imágenes cuando sea razonable.

---

# 19. Variables de entorno

Crear:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

MASTER_ADMIN_CODE=
```

Agregar `.env.example`.

Nunca subir `.env.local` al repositorio.

---

# 20. Validación

Utilizar una librería de validación como Zod.

Validar:

* precio;
* rango numérico;
* fecha;
* WhatsApp;
* título;
* descripción;
* términos;
* código de administración;
* número ganador.

El número inicial no puede ser mayor que el número final.

El precio debe ser mayor que cero.

El número ganador debe pertenecer al rango.

---

# 21. Estados de la rifa

Una rifa puede estar:

```text
active
finished
cancelled
```

Una rifa finalizada:

* no permite nuevas reservas;
* no permite vender nuevos números;
* muestra el ganador;
* conserva la información histórica.

---

# 22. SEO y compartir

La página pública debe tener metadata dinámica.

La metadata debe utilizar:

* nombre del premio;
* descripción;
* imagen del premio.

Debe funcionar correctamente al compartir el enlace por WhatsApp.

Agregar Open Graph metadata.

---

# 23. UX

La aplicación debe ser mobile-first.

El participante debe poder:

```text
Abrir enlace
↓
Ver premio
↓
Ver números
↓
Seleccionar número
↓
Presionar WhatsApp
```

en muy pocos pasos.

No pedir registro al participante.

No pedir correo.

No pedir contraseña.

No crear carrito de compras.

No implementar pasarela de pagos en el MVP.

---

# 24. Panel administrativo

El panel debe ser funcional y sencillo.

No crear un dashboard excesivamente complejo.

Mostrar estadísticas útiles:

```text
Total de números
Vendidos
Disponibles
Reservados
Ingresos potenciales
Ingresos por vendidos
```

Si se muestra "ingresos", dejar claro que representa el valor de boletos marcados como vendidos y no pagos bancarios verificados.

---

# 25. Código

TypeScript estricto.

No usar:

```ts
any
```

sin una razón técnica excepcional.

Preferir tipos explícitos.

No duplicar tipos.

Separar:

```text
types/
lib/
components/
actions/
```

cuando mejore la mantenibilidad.

No crear una estructura de carpetas exagerada.

---

# 26. Errores

Todos los errores importantes deben tener mensajes comprensibles.

Ejemplos:

```text
Este número ya fue vendido.

La rifa ya finalizó.

El código de administración no es válido.

No fue posible guardar los cambios.

El número ganador debe pertenecer a los números vendidos.
```

No mostrar stack traces al usuario.

---

# 27. Reglas de implementación

Antes de implementar una funcionalidad:

1. revisar el código existente;
2. reutilizar componentes;
3. evitar duplicación;
4. comprobar los tipos;
5. comprobar validaciones;
6. comprobar estados de error.

No modificar archivos no relacionados sin necesidad.

No instalar dependencias innecesarias.

No reemplazar una librería existente si ya resuelve el problema.

---

# 28. Testing

Como mínimo probar:

* creación de rifa;
* acceso mediante código maestro;
* acceso mediante código de rifa;
* generación de slug;
* selección de números;
* imposibilidad de seleccionar números vendidos;
* concurrencia al vender números;
* selección random;
* selección manual;
* finalización de rifa;
* redirección a WhatsApp.

Las operaciones críticas de base de datos deben tener pruebas o verificaciones claras.

---

# 29. Migraciones de base de datos

Toda modificación al esquema de la base de datos debe documentarse en un archivo de migración dentro de la carpeta `migrations/`.

Cada archivo de migración debe contener:

1. nombre descriptivo del cambio;
2. fecha de creación;
3. sentencia SQL completa;
4. descripción breve de para qué sirve el cambio.

Formato del nombre del archivo:

```text
YYYY-MM-DD_descripcion_corta.sql
```

Ejemplo:

```text
2026-09-18_agregar_campos_participante_tickets.sql
```

Contenido del archivo:

```sql
-- =====================================================
-- MIGRATION: 2026-09-18 - Agregar campos de participante a tickets
-- =====================================================
-- Descripcion: Agrega columnas para guardar nombre, telefono,
-- monto pagado, estado de pago y direccion de entrega
-- =====================================================

ALTER TABLE tickets ADD COLUMN participant_name TEXT;
ALTER TABLE tickets ADD COLUMN participant_phone TEXT;
-- ... etc
```

No modificar `lib/schema.sql` directamente cuando exista una migración.

El archivo `lib/schema.sql` representa el esquema completo actualizado (se actualiza después de aplicar la migración).

---

# 30. Deployment

Objetivo inicial:

```text
GitHub
   ↓
Vercel
   ↓
Next.js
   ↓
Supabase
```

No agregar servidores adicionales.

La aplicación debe poder ejecutarse localmente con:

```bash
npm install
npm run dev
```

Y compilar con:

```bash
npm run build
```

Antes de considerar terminada una funcionalidad, comprobar:

```bash
npm run lint
npm run build
```

---

# 31. Principio fundamental

La aplicación debe sentirse como una herramienta pequeña y rápida, no como un sistema empresarial.

Si una solución requiere:

* microservicios;
* múltiples servidores;
* Redis;
* colas;
* Kubernetes;
* Docker;
* un backend independiente;
* autenticación empresarial;

debe cuestionarse primero si realmente es necesaria.

La solución preferida es siempre la más sencilla que mantenga la seguridad y consistencia de los datos.

---

# 32. Evolución futura

No implementar todavía, pero mantener una arquitectura que permita posteriormente:

* múltiples administradores;
* cuentas de usuario;
* pagos online;
* reservas temporales;
* notificaciones;
* estadísticas avanzadas;
* historial de participantes;
* comprobantes;
* dominios personalizados;
* QR de rifas;
* plantillas de rifas;
* múltiples monedas;
* sistema de suscripción para organizadores.

Estas funcionalidades no forman parte del MVP inicial.
