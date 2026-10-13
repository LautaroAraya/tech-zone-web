# Tech Zone — sitio público + panel administrador

Sitio web adaptable a celular y computadora, con:
- Vista pública para clientes.
- Acceso de administrador por correo y contraseña.
- Galería de trabajos: el carrusel público se oculta automáticamente cuando no hay fotos.
- Configuración de teléfono, WhatsApp, Instagram, ubicación, horarios y presentación.
- Alta de servicios y opción de ocultarlos.
- Fotos y datos guardados en Supabase, no solamente en el navegador.

## 1. Crear la base y el almacenamiento

1. Creá un proyecto en https://supabase.com/.
2. Entrá a **SQL Editor**, abrí `supabase.sql`, pegá todo el contenido y ejecutalo.
3. En **Storage**, creá un bucket llamado `tech-zone-photos` y marcá **Public bucket**.
4. En **Authentication > Users**, creá un usuario con el correo y contraseña que vas a usar como administrador.
5. En **Authentication > Settings**, desactivá los registros públicos de usuarios. No compartas la cuenta administradora.

## 2. Configurar el sitio

1. Instalá Node.js LTS: https://nodejs.org/
2. Descomprimí el proyecto y abrí esa carpeta en VS Code.
3. En la terminal ejecutá `npm install`.
4. Copiá `.env.example` a un archivo nuevo llamado `.env` y completá los datos de Supabase:
   - `VITE_SUPABASE_URL`: Project URL.
   - `VITE_SUPABASE_ANON_KEY`: clave pública/publishable del proyecto.
5. Ejecutá `npm run dev` para probarlo localmente.
6. Ejecutá `npm run build` para comprobar que compila.

## 3. Publicarlo en Vercel

1. Subí esta carpeta a un repositorio privado o público de GitHub.
2. En Vercel importá el repositorio. Vercel detecta Vite automáticamente.
3. En **Settings > Environment Variables**, agregá `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Volvé a desplegar después de agregar las variables.

## 4. Cómo usarlo

- Abrí la web pública y tocá **Administrador** al pie de la página.
- Iniciá sesión con el usuario creado en Supabase.
- En **Galería**, cargá la imagen, agregá título/descripción y publicala.
- En **Configuración**, completá teléfono, WhatsApp, Instagram, dirección y horarios.
- Los clientes verán los cambios guardados al recargar la web.

## Importante

La clave pública/anon de Supabase está pensada para estar en el frontend; la protección depende de las políticas RLS incluidas en `supabase.sql` y de que los registros públicos estén desactivados. Nunca pongas una `service_role key` en el frontend. Antes de usar la página comercialmente, probá el inicio de sesión, la subida/eliminación de fotos y los permisos de las tablas y Storage.
