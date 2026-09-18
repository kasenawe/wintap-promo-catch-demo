# Promo Catch

Demo web confidencial de **WINTAP Promo Catch**. Reproduce el archivo `.riv` aprobado mediante el runtime oficial de Rive. No es un producto en producción ni una implementación contratada.

## Carácter confidencial

Esta preview es técnica y confidencial. El proyecto está preparado para permanecer fuera de buscadores (`noindex`), pero **eso no sustituye un control de acceso**. El acceso se configurará después con Vercel Authentication y un Shareable Link revocable.

## Stack

- React 19.3.0
- TypeScript 6.0.3
- Vite 8.3.0
- `@rive-app/react-canvas` 4.34.3
- CSS Modules
- ESLint 9
- npm
- Hosting previsto: Vercel (Vite, sin SSR)

## Requisitos

- Node.js 20.19+ o 22.12+
- npm 10+
- Chrome o Edge actuales para la validación visual

## Instalación

```bash
npm install
```

## Ejecución local

```bash
npm run dev
```

Abre `http://localhost:5173`.

## Build

```bash
npm run build
```

## Preview local

```bash
npm run preview
```

Abre `http://localhost:4173`.

Otros scripts:

```bash
npm run lint
npm run typecheck
npm run test:privacy
npm run test:e2e
npm run test
```

`npm run test:e2e` requiere un build previo y Chromium de Playwright:

```bash
npx playwright install chromium
npm run build
npm run test:e2e
```

## Estructura relevante

```text
wintap_promo_catch_—_technical_concept.riv   archivo original, no modificar
src/assets/wintap-promo-catch.riv            copia de build, hash idéntico
src/components/PromoCatchExperience.tsx      runtime oficial de Rive
src/App.tsx                                  presentación y reinicio
public/robots.txt                            bloqueo de rastreo
vercel.json                                  encabezado X-Robots-Tag
```

## Integración de Rive

La experiencia carga el `.riv` como asset local, no como recreación HTML/CSS.

- Runtime: `@rive-app/react-canvas`
- Artboard: `PromoScreen`
- State Machine: `PromoMachine`
- `autoplay: true`
- `autoBind: true`
- `Fit.Contain` y alineación centrada
- Listeners nativos de Rive habilitados
- El clic real ocurre dentro del canvas

`claimPromo` y `expirePromo` son triggers de `ViewModel1`, no inputs tradicionales de la State Machine. Por eso `stateMachineInputs("PromoMachine")` devuelve `[]` y eso no es un error. El Listener `Click` de `CatchButton` ejecuta `set ./ claimPromo`. La integración debe usar `autoBind: true` para enlazar la instancia del View Model. Sin `autoBind`, el runtime carga y reproduce la State Machine, pero la acción del listener no tiene una instancia enlazada.

No se llama a esos triggers desde JavaScript. El archivo `.riv` no se modifica.

La API actual del paquete usa `stateMachine` (singular). `stateMachines` sigue funcionando, pero está deprecado y genera un warning del runtime.

El reinicio (`Reiniciar demo`) remonta el componente con una `key` de React para obtener una instancia limpia, sin recargar la página y sin alterar la State Machine.

## Privacidad / no indexación

- `index.html`: `noindex, nofollow, noarchive, nosnippet`
- `public/robots.txt`: `Disallow: /`
- `vercel.json`: encabezado global `X-Robots-Tag`
- Sin sitemap
- Sin datos personales ni secretos en el repositorio

**Limitación:** `noindex` evita indexación, no es un control de acceso.

## Preparación para Vercel

El proyecto es un sitio Vite estático. En Vercel:

1. Framework Preset: Vite
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. No publicar hasta tener autorización
5. Después del primer preview: activar Vercel Authentication y crear un Shareable Link revocable

## Procedimiento recomendado de QA

1. `npm install`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
5. `npm run preview`
6. Caso A: carga inicial, halo y countdown
7. Caso B: un clic en el botón real del canvas antes de 15 s
8. Caso C: esperar 15 s sin interactuar
9. Caso D: `Reiniciar demo` después de éxito y después de vencimiento
10. Caso E: 390×844, 360×800, 412×915, 768×1024 y 1440×900

## Dictamen

**APTO.**

Validaciones confirmadas:

1. Carga de `PromoScreen` y `PromoMachine`.
2. Data Binding de `ViewModel1` sin warnings.
3. Clic real antes de 15 segundos.
4. Emisión de `ButtonPress` y `PromoClaimed`.
5. Estado visual final `¡PROMO ATRAPADA!`.
6. Segundo clic bloqueado.
7. Vencimiento sin interacción.
8. Reinicio limpio.
9. Responsive en los cinco viewports.
10. `npm run test` completo.
