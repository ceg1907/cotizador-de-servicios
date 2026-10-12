# Cotizador de Servicios

Simulador de cotizaciones para empresas de servicios. Permite armar presupuestos eligiendo un cliente y servicios, calcular subtotal, impuesto y total, guardarlos en un historial y descargarlos en PDF.

Proyecto final del curso de JavaScript de Coderhouse.

🔗 **Demo:** [https://ceg1907.github.io/cotizador-de-servicios/](https://ceg1907.github.io/cotizador-de-servicios/)

## Funcionalidades

- **Cotizador:** selección de cliente y servicios, cantidades, fecha de vigencia y cálculo automático de subtotal, IVA y total. El borrador se guarda aunque se cierre la página.
- **Historial:** listado de cotizaciones con búsqueda por cliente o número, filtros por estado y categoría, cambio de estado (pendiente o completada; las vencidas se detectan solas) y eliminación.
- **PDF:** descarga de cada cotización como presupuesto en PDF, desde el historial o al confirmarla.
- **Configuración:** alta y baja de servicios y clientes, datos de la empresa (nombre, contacto e impuesto) y botón para restablecer los datos iniciales.
- **Moneda:** visualización de precios en dólares o en pesos, con la cotización del dólar oficial obtenida en tiempo real desde DolarAPI.

## Tecnologías

- HTML5, CSS3 y JavaScript
- [Bootstrap 5](https://getbootstrap.com/): pestañas y modales
- [SweetAlert2](https://sweetalert2.github.io/): avisos y confirmaciones
- [jsPDF](https://github.com/parallax/jsPDF) y [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable): generación de PDF
- [LDRS](https://uiball.com/ldrs/): animación de carga
- [DolarAPI](https://dolarapi.com/): cotización del dólar oficial
- `localStorage` para guardar los datos (sin backend)

## Cómo ejecutarlo

La forma más simple es abrir el link de la **demo** .

Para correrlo en tu computadora: la app carga los datos iniciales desde archivos JSON con `fetch`, por lo que **necesita un servidor local** . Si se abre el `index.html` con doble clic, los datos no se cargan.

1. Clonar el repositorio:
2. Abrir la carpeta en VS Code.
3. Hacer clic derecho en `index.html` → **Open with Live Server** (extensión Live Server).

```bash
   git clone https://github.com/ceg1907/cotizador-de-servicios.git
```

## Estructura

```
├── index.html          → Cotizador
├── pages/
│   ├── historial.html  → Historial de cotizaciones
│   └── admin.html      → Configuración
├── css/
│   └── style.css
├── js/
│   ├── app.js          → Funciones compartidas (storage, fetch, formatos, PDF, moneda)
│   ├── cotizador.js    → Lógica del cotizador
│   └── gestion.js      → Lógica del historial y la configuración
├── data/
│   ├── servicios.json  → Servicios iniciales
│   └── clientes.json   → Clientes iniciales
└── assets/             → Favicon e íconos
```

## Autora

Cristina Gonzalez · [GitHub](https://github.com/ceg1907)
