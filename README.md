# Gastos de Viaje

Web app sencilla para llevar el control de gastos durante viajes de negocios. Registra cada gasto (comida, taxi, hospedaje, etc.) con **monto, fecha, categoría y con qué tarjeta pagaste**, y márcalo como "subido" cuando ya lo reportaste, con **doble confirmación** para no marcarlo por error.

Todo se guarda en el **localStorage del navegador**: no hay servidor, no se envía nada a internet. Los datos viven en el dispositivo donde abras la app.

## Funciones

- Registrar gastos con concepto, monto, fecha, categoría y tarjeta.
- Marcar gastos como **subidos** con doble confirmación.
- Filtrar por **Todos / Sin subir / Subidos**.
- Resumen de total, monto pendiente y número de gastos.
- Administrar tus tarjetas/formas de pago.
- Exportar e importar respaldo en JSON.
- Instalable en el teléfono (se añade a la pantalla de inicio).

## Opción A: subir por la web de GitHub (sin instalar nada)

Es la forma más rápida porque no necesitas Git instalado.

1. Entra a https://github.com e inicia sesión (o crea una cuenta gratis).
2. Haz clic en el botón **+** (arriba a la derecha) → **New repository**.
3. Ponle un nombre, por ejemplo `gastos-viaje`.
4. Déjalo en **Public** y haz clic en **Create repository**.
5. En la página del repo vacío, haz clic en el enlace **uploading an existing file**
   (o ve a **Add file → Upload files**).
6. Arrastra estos archivos desde la carpeta del proyecto a la ventana:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `manifest.json`
   - `icon.svg`
7. Abajo escribe un mensaje (ej. "primera versión") y haz clic en **Commit changes**.

### Activar GitHub Pages

1. En el repo ve a **Settings** (pestaña de arriba).
2. En el menú lateral entra a **Pages**.
3. En **Source** elige **Deploy from a branch**.
4. En **Branch** elige `main` y la carpeta `/ (root)`, y haz clic en **Save**.
5. Espera 1–2 minutos y recarga. GitHub te mostrará la URL, tipo:
   `https://TU-USUARIO.github.io/gastos-viaje/`

## Abrir e instalar en el iPhone

1. Copia la URL de GitHub Pages (la del paso anterior).
2. Ábrela en **Safari** en tu iPhone (funciona mejor que otros navegadores para instalar).
3. Toca el botón **Compartir** (el cuadrito con la flecha hacia arriba, abajo en la barra).
4. Desliza y toca **Agregar a inicio** (Add to Home Screen).
5. Ponle nombre (ej. "Gastos") y toca **Agregar**.
6. Se creará un ícono en tu pantalla de inicio. Al abrirlo se ve en pantalla
   completa, como una app normal.

> Nota: los gastos se guardan en el propio iPhone (en Safari). Mientras no borres
> los datos del sitio, quedan guardados aunque cierres la app.

## Opción B: subir con Git (línea de comandos)

Solo si prefieres usar Git. Primero instálalo desde https://git-scm.com/download/win
y reinicia la terminal. Luego, dentro de la carpeta del proyecto:

```bash
git init
git add .
git commit -m "App de gastos de viaje"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/gastos-viaje.git
git push -u origin main
```

Después activa GitHub Pages igual que en la Opción A.

## Actualizar la app más adelante

- **Por la web:** entra al repo → **Add file → Upload files**, sube los archivos
  cambiados y haz **Commit changes**. Pages se actualiza solo en un par de minutos.
- **Con Git:** `git add .`, luego `git commit -m "cambios"` y `git push`.

## Nota sobre los datos

Como los datos se guardan en el navegador del dispositivo:
- Si abres la app en otro teléfono, no verás los mismos gastos.
- Usa **Exportar** para hacer un respaldo e **Importar** para pasarlos a otro dispositivo.
- Borrar los datos de navegación del sitio elimina los gastos.
