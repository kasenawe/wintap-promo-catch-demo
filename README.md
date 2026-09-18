# Promo Catch

Demo web de un concepto técnico independiente de **Promo Catch**, preparado como propuesta para WINTAP. Reproduce el archivo `.riv` aprobado mediante el runtime oficial de Rive. No es un producto en producción ni una implementación contratada.

## Alcance de la demo

Esta preview es técnica y no oficial. El proyecto está preparado para permanecer fuera de buscadores (`noindex`), aunque la URL desplegada puede ser visitada por cualquiera que la conozca.

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
rive/promo-catch/scene.rml                   fuente editable de la escena Rive
rive/promo-catch/Montserrat.ttf              fuente open source embebida
src/assets/wintap-promo-catch.riv            build generado para el runtime
src/components/PromoCatchExperience.tsx      runtime oficial de Rive
src/App.tsx                                  presentación y reinicio
public/robots.txt                            bloqueo de rastreo
vercel.json                                  encabezado X-Robots-Tag
```

Para estudiar la arquitectura, el flujo React–Rive, Data Binding, responsive,
privacidad, pruebas y despliegue, consulta
[`docs/TECHNICAL_OVERVIEW.md`](docs/TECHNICAL_OVERVIEW.md).

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

`PromoViewModel` expone `started`, `claimed`, `expired` y `ctaLabel`. Los
listeners de Rive escriben `started` al tocar la W y `claimed` al tocar el CTA.
React observa esas propiedades, inicia los 30 segundos después de la revelación
y actualiza `ctaLabel`; cuando llega a cero escribe `expired`. La representación,
los hit targets y las transiciones visuales siguen dentro del `.riv`.

La integración necesita `autoBind: true` para enlazar la instancia del View
Model. La fuente RML se conserva en el repositorio y el `.riv` se vuelve a
generar con la CLI oficial de Rive.

La API actual del paquete usa `stateMachine` (singular). `stateMachines` sigue funcionando, pero está deprecado y genera un warning del runtime.

El reinicio (`Reiniciar demo`) remonta el componente con una `key` de React para obtener una instancia limpia, sin recargar la página y sin alterar la State Machine.

## Privacidad / no indexación

- `index.html`: `noindex, nofollow, noarchive, nosnippet`
- `public/robots.txt`: `Disallow: /`
- `vercel.json`: encabezado global `X-Robots-Tag`
- Sin sitemap
- Sin datos personales ni secretos en el repositorio

**Limitación:** `noindex` evita la indexación en buscadores, pero no controla el acceso. Cualquiera que conozca la URL pública podrá visitar la demo.

## Preparación para Vercel

El proyecto es un sitio Vite estático. En Vercel:

1. Framework Preset: Vite
2. Build Command: `npm run build`
3. Output Directory: `dist`
4. Publicar como deployment público no indexado
5. Verificar después del deploy los metadatos y el encabezado `X-Robots-Tag`

## Procedimiento recomendado de QA

1. `npm install`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run build`
5. `npm run preview`
6. Caso A: tocar la W y observar la revelación de 2,5 s + 200 ms de negro
7. Caso B: atrapar desde el botón real del canvas antes de 30 s
8. Caso C: esperar 30 s sin interactuar
9. Caso D: `Reiniciar demo` después de éxito y después de vencimiento
10. Caso E: 390×844, 360×800, 412×915, 768×1024 y 1440×900

## Dictamen

**APTO.**

Validaciones confirmadas:

1. Carga de `PromoScreen` y `PromoMachine`.
2. Data Binding de `PromoViewModel` sin warnings.
3. Activación real desde la W dentro del canvas.
4. Revelación de 2,5 s, corte negro de 200 ms y countdown de 30 s.
5. Estado visual final `PROMO ATRAPADA`.
6. Segundo clic bloqueado.
7. Vencimiento sin interacción.
8. Reinicio limpio.
9. Responsive en los cinco viewports.
10. `npm run test` completo.
