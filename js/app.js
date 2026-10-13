// ===== VARIABLES ====

const CLAVE_SERVICIOS = 'serviciosCargados';
const CLAVE_CLIENTES = 'clientesCargados';
const CLAVE_HISTORIAL_COTIZACIONES = 'historialCotizaciones';
const CLAVE_BORRADOR = 'borradorEnCurso';
const CLAVE_EMPRESA = 'datosEmpresa';
const CLAVE_MONEDA = 'monedaSeleccionada';

const IMPUESTO_POR_DEFECTO = 21;
const DESCUENTO_POR_DEFECTO = 0;

// ===== FUNCIONES REUTILIZABLES =====

// CAMBIAR NOMBRE DE LA EMPRESA HEADER

function mostrarNombreEmpresa() {
  const datosEmpresa = leerStorage(CLAVE_EMPRESA, {});
  const idContenedorNombre = document.getElementById('nombre-empresa-header');

  idContenedorNombre.textContent = datosEmpresa.nombre || 'Nombre empresa';
}

// CERRAR Y LIMPIAR FORMULARIO

function cerrarYLimpiarModal(idModal, idFormulario) {
  const modal = bootstrap.Modal.getOrCreateInstance(
    document.getElementById(idModal),
  );
  modal.hide();
  const formulario = document.getElementById(idFormulario);
  formulario.reset();
}

// FUNCION PARA AGRUPAR EVENTOS

function escucharEvento(id, tipoEvento, funcion) {
  const elemento = document.getElementById(id);
  if (elemento) {
    elemento.addEventListener(tipoEvento, funcion);
  }
}

// MENSAJE DE BOX VACIA

function mostrarMensajeVacio(idContenedor, texto, clases) {
  const idBox = document.getElementById(idContenedor);

  const textoBoxVacio = document.createElement('p');
  textoBoxVacio.className =
    clases === undefined ? 'texto-ayuda texto-vacio-centrado' : clases;
  textoBoxVacio.textContent = texto;
  idBox.replaceChildren(textoBoxVacio);
}

// STORAGE

function guardarEnStorage(clave, dataBase) {
  const datosConvertido = JSON.stringify(dataBase);

  localStorage.setItem(clave, datosConvertido);
}

function leerStorage(clave, dataBase) {
  let datosStorage = localStorage.getItem(clave);
  if (datosStorage === null) {
    return dataBase;
  } else {
    const datosEnJson = JSON.parse(datosStorage);
    return datosEnJson;
  }
}

// GENERADOR DE ID

function generarId() {
  const idNuevo = Date.now();
  return idNuevo;
}

// LEER DATOS

function leerBorrador() {
  const borradorGuardado = leerStorage(CLAVE_BORRADOR, {
    cliente: null,
    servicios: [],
    vigencia: '',
  });
  return borradorGuardado;
}

function leerCampo(id) {
  const input = document.getElementById(id);
  const valor = input.value.trim();

  return valor;
}

// ESCRIBIR DATOS

function escribirCampo(id, valor) {
  const input = document.getElementById(id);
  input.value = valor;
}

// CALCULOS (MONTO,SUBTOTAL, TOTAL)
function calcularMonto(servicio) {
  return servicio.cantidad * servicio.precio;
}

function calcularSubtotal(servicios) {
  const subtotal = servicios.reduce(
    (acc, servicio) => calcularMonto(servicio) + acc,
    0,
  );
  return subtotal;
}

function calcularTotal(montoAcc, descuentoAplic, impuestoAplic) {
  const subtotal = calcularSubtotal(montoAcc);
  const descuento = (subtotal * descuentoAplic) / 100;
  const baseImponible = subtotal - descuento;
  const impuesto = (baseImponible * impuestoAplic) / 100;
  const total = baseImponible + impuesto;

  return { subtotal, descuento, impuesto, total };
}

// AVISOS REUTILIZABLE (SweetAlert)

const avisoToast = Swal.mixin({
  toast: true,
  position: 'bottom',
  showConfirmButton: false,
  timer: 2500,
  timerProgressBar: true,
  customClass: {
    popup: 'toast-cotizador',
  },
});

function mostrarAviso(texto, icono = 'warning') {
  avisoToast.fire({
    icon: icono,
    title: texto,
  });
}

const modalCotizador = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  customClass: {
    popup: 'modal-cotizador',
    confirmButton: 'btn-primario',
    cancelButton: 'btn-secundario',
  },
});

// LOADER

function cargarLoader(cargando) {
  const boxLoader = document.getElementById('box-cargando');

  cargando === true
    ? boxLoader.classList.remove('d-none')
    : boxLoader.classList.add('d-none');
}

// FUNCION CREAR FILAS

function renderizarLista(items, crearFila, idContenedor) {
  let itemsDom = '';
  items.forEach((item) => {
    itemsDom += crearFila(item);
  });

  const idBox = document.getElementById(idContenedor);
  idBox.innerHTML = itemsDom;
}

// FORMATO DE MONEDA

const formatoDolares = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
});
const formatoArs = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
});

function formatearMoneda(numero) {
  const monedaGuardada = leerStorage(CLAVE_MONEDA, {});
  const { moneda, cotizacion } = monedaGuardada;
  const tipoMoneda = moneda === 'ARS' ? formatoArs : formatoDolares;
  return tipoMoneda.format((cotizacion || 1) * numero);
}

function marcarMoneda() {
  const monedaGuardada = leerStorage(CLAVE_MONEDA, {});
  const btnArs = document.getElementById('btn-moneda-ars');
  const btnUsd = document.getElementById('btn-moneda-usd');
  const botonActivo = monedaGuardada.moneda === 'ARS' ? btnArs : btnUsd;

  botonActivo.classList.add('btn-moneda-activo');
}

// FUNCION PARA VALOR IMPUESTO

function obtenerImpuesto() {
  const datosEmpresa = leerStorage(CLAVE_EMPRESA, {});
  return datosEmpresa.impuesto ?? IMPUESTO_POR_DEFECTO;
}

// ===== FETCH =====

// SERVICIOS

async function traerServicios(rutaAcceso) {
  try {
    const rutaCompleta =
      rutaAcceso === undefined
        ? 'data/servicios.json'
        : rutaAcceso + 'data/servicios.json';

    cargarLoader(true);
    const serviciosDb = await fetch(rutaCompleta);
    if (!serviciosDb.ok) {
      throw new Error('No se pudo cargar el archivo');
    }
    const servicios = await serviciosDb.json();
    return servicios;
  } catch (error) {
    modalCotizador.fire({
      icon: 'error',
      title: 'No pudimos cargar los servicios',
      text: 'Revisá tu conexión y volvé a cargar la página.',
      confirmButtonText: 'Entendido',
    });
    return null;
  } finally {
    cargarLoader(false);
  }
}

async function traerTodosLosServicios(rutaAcceso) {
  const serviciosDelStorage = leerStorage(CLAVE_SERVICIOS, null);

  if (serviciosDelStorage !== null) {
    return serviciosDelStorage;
  } else {
    const serviciosDelJson = await traerServicios(rutaAcceso);
    if (serviciosDelJson === null) {
      return [];
    }
    guardarEnStorage(CLAVE_SERVICIOS, serviciosDelJson);
    return serviciosDelJson;
  }
}

// CLIENTES

async function traerClientes(rutaAcceso) {
  try {
    const rutaCompleta =
      rutaAcceso === undefined
        ? 'data/clientes.json'
        : rutaAcceso + 'data/clientes.json';

    cargarLoader(true);
    const clientesDb = await fetch(rutaCompleta);
    if (!clientesDb.ok) {
      throw new Error('No se pudo cargar el archivo');
    }
    const clientes = await clientesDb.json();
    return clientes;
  } catch {
    modalCotizador.fire({
      icon: 'error',
      title: 'No pudimos cargar los clientes',
      text: 'Revisá tu conexión y volvé a cargar la página.',
      confirmButtonText: 'Entendido',
    });
    return null;
  } finally {
    cargarLoader(false);
  }
}

async function traerTodosLosClientes(rutaAcceso) {
  const clientesDelStorage = leerStorage(CLAVE_CLIENTES, null);

  if (clientesDelStorage !== null) {
    return clientesDelStorage;
  } else {
    const clientesDelJson = await traerClientes(rutaAcceso);
    if (clientesDelJson === null) {
      return [];
    }
    guardarEnStorage(CLAVE_CLIENTES, clientesDelJson);
    return clientesDelJson;
  }
}

// DOLAR API

async function traerCotizacionDolar() {
  try {
    cargarLoader(true);
    const cotizacionDolar = await fetch(
      'https://dolarapi.com/v1/dolares/oficial',
    );
    if (!cotizacionDolar.ok) {
      throw new Error('No se pudo obtener la cotización');
    }
    const dolarJson = await cotizacionDolar.json();
    const { venta } = dolarJson;
    return venta;
  } catch {
    modalCotizador.fire({
      icon: 'error',
      title: 'No pudimos cargar la cotización',
      text: 'Revisá tu conexión y volvé a cargar la página.',
      confirmButtonText: 'Entendido',
    });
    return null;
  } finally {
    cargarLoader(false);
  }
}

async function cambiarMonedaArs() {
  const cotizacionDolar = await traerCotizacionDolar();
  if (cotizacionDolar === null) {
    return;
  } else {
    guardarEnStorage(CLAVE_MONEDA, {
      moneda: 'ARS',
      cotizacion: cotizacionDolar,
    });
    location.reload();
  }
}

escucharEvento('btn-moneda-ars', 'click', cambiarMonedaArs);

function cambiarMonedaUsd() {
  guardarEnStorage(CLAVE_MONEDA, { moneda: 'USD' });
  location.reload();
}
escucharEvento('btn-moneda-usd', 'click', cambiarMonedaUsd);

// ==== CATEGORIAS ====

function traerCategorias(servicios) {
  let categorias = servicios.map((servicio) => servicio.categoria);
  categorias = [...new Set(categorias)];
  return categorias;
}

// ===== HISTORIAL DE COTIZACIONES =====

function generarNumeroCotizacion() {
  const traerDbHistorial = leerStorage(CLAVE_HISTORIAL_COTIZACIONES, []);
  if (traerDbHistorial.length === 0) {
    return 1;
  } else {
    const numeros = traerDbHistorial.map(
      (cotizacion) => cotizacion.numeroCotizacion,
    );
    const numCotizacionMayor = numeros.reduce(
      (acc, num) => Math.max(acc, num),
      0,
    );
    return numCotizacionMayor + 1;
  }
}

// ====== FUNCION GENERAR PDF =====

function generarPdfCotizacion(cotizacion) {
  const {
    numeroCotizacion,
    fecha,
    cliente,
    servicios,
    porcentajeImpuesto,
    impuesto,
    subtotal,
    total,
    validoHasta,
    descuento,
    porcentajeDescuento,
  } = cotizacion;
  const { nombre, email, telefono, direccion, ciudad } = cliente;

  const datosEmpresa = leerStorage(CLAVE_EMPRESA, {});
  const {
    nombre: nombreEmpresa,
    telefono: telefonoEmpresa,
    email: emailEmpresa,
    direccion: direccionEmpresa,
  } = datosEmpresa;
  const datosContacto = [telefonoEmpresa, emailEmpresa, direccionEmpresa]
    .filter((dato) => dato)
    .join(' | ');

  const { jsPDF } = window.jspdf;
  const documento = new jsPDF();

  // Título
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(28);
  documento.setTextColor('#1F4B43');
  documento.text('COTIZACIÓN', 105, 30, { align: 'center' });

  // Número
  documento.setFontSize(14);
  documento.text(formatearNumeroCotizacion(numeroCotizacion), 105, 39, {
    align: 'center',
  });

  // Fecha
  documento.setFont('helvetica', 'normal');
  documento.setFontSize(10);
  documento.setTextColor('#5B6472');
  documento.text(`Fecha: ${formatearFecha(fecha)}`, 105, 46, {
    align: 'center',
  });

  // Datos cliente

  documento.setFont('helvetica', 'bold');
  documento.setFontSize(11);
  documento.setTextColor('#1F4B43');
  documento.text('CLIENTE', 20, 62);

  documento.setFont('helvetica', 'normal');
  documento.setFontSize(10);
  documento.setTextColor('#34383b');
  documento.text(`Nombre: ${nombre}`, 20, 69);
  documento.text(`Email: ${email}`, 20, 75);
  documento.text(`Teléfono: ${telefono}`, 20, 81);
  documento.text(
    `Dirección: ${direccion || 'sin especificar'}, ${ciudad || 'ciudad no especificada'}`,
    20,
    87,
  );

  // Tabla de servicios cotizados

  documento.autoTable({
    startY: 97,
    margin: { left: 20, right: 20 },
    head: [['Servicio', 'Cantidad', 'Precio', 'Subtotal']],
    body: servicios.map((servicio) => [
      servicio.nombre,
      formatearCantidad(servicio.cantidad, servicio.unidad),
      formatearMoneda(servicio.precio),
      formatearMoneda(calcularMonto(servicio)),
    ]),
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      textColor: '#34383b',
      lineColor: '#DDE1DC',
      cellPadding: 3,
    },
    headStyles: {
      fillColor: '#1F4B43',
      textColor: '#FFFFFF',
      fontStyle: 'bold',
      halign: 'center',
    },
    alternateRowStyles: { fillColor: '#E7EEEC' },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
  });

  const finTabla = documento.lastAutoTable.finalY;
  const hayDescuento = porcentajeDescuento > 0;
  const alturaExtra = hayDescuento ? 7 : 0;

  // Caja de totales
  documento.setFillColor('#E7EEEC');
  documento.rect(120, finTabla + 6, 70, 28 + alturaExtra, 'F');

  documento.setFont('helvetica', 'normal');
  documento.setFontSize(10);
  documento.setTextColor('#34383b');
  documento.text('Subtotal', 125, finTabla + 13);
  documento.text(formatearMoneda(subtotal), 185, finTabla + 13, {
    align: 'right',
  });

  if (hayDescuento) {
    documento.text(`Descuento (${porcentajeDescuento}%)`, 125, finTabla + 20);
    documento.text(`-${formatearMoneda(descuento)}`, 185, finTabla + 20, {
      align: 'right',
    });
  }

  documento.text(
    `IVA (${porcentajeImpuesto}%)`,
    125,
    finTabla + 20 + alturaExtra,
  );
  documento.text(formatearMoneda(impuesto), 185, finTabla + 20 + alturaExtra, {
    align: 'right',
  });

  documento.setFont('helvetica', 'bold');
  documento.setFontSize(12);
  documento.setTextColor('#1F4B43');
  documento.text('Total', 125, finTabla + 29 + alturaExtra);
  documento.setTextColor('#C98A3B');
  documento.text(formatearMoneda(total), 185, finTabla + 29 + alturaExtra, {
    align: 'right',
  });

  // Validez
  documento.setFont('helvetica', 'normal');
  documento.setFontSize(9);
  documento.setTextColor('#5B6472');
  documento.text(
    `Cotización válida hasta el ${formatearFecha(validoHasta)}. Pasada esa fecha, deberá solicitar una nueva cotización y los precios pueden variar.`,
    20,
    finTabla + 13,
    { maxWidth: 90 },
  );

  // Pie de cotizacion

  documento.setDrawColor('#DDE1DC');
  documento.line(20, 270, 190, 270);

  documento.setFont('helvetica', 'bold');
  documento.setFontSize(10);
  documento.setTextColor('#1F4B43');
  documento.text(nombreEmpresa || 'Nombre empresa', 105, 277, {
    align: 'center',
  });

  documento.setFont('helvetica', 'normal');
  documento.setFontSize(9);
  documento.setTextColor('#5B6472');
  documento.text(datosContacto || 'No hay una empresa registrada.', 105, 283, {
    align: 'center',
  });

  documento.save(formatearNumeroCotizacion(numeroCotizacion) + '.pdf');
}

// ===== FORMATEADORES =====

// NUMEROS

function formatearNumeroCotizacion(numero) {
  return `COT-${String(numero).padStart(4, '0')}`;
}

// FECHA
function formatearFecha(fechaGuardada) {
  const partes = fechaGuardada.split('-');
  const partesInvertidas = partes.reverse();
  return partesInvertidas.join('/');
}

// TEXTO
function formatearTexto(texto) {
  return texto
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// CANTIDAD
function formatearCantidad(cantidad, tipoUnidad) {
  const ultimaLetra = tipoUnidad[tipoUnidad.length - 1];
  if (cantidad === 1) {
    return `${cantidad} ${tipoUnidad}`;
  } else if ('aeiou'.includes(ultimaLetra)) {
    return `${cantidad} ${tipoUnidad}s`;
  } else {
    return `${cantidad} ${tipoUnidad}es`;
  }
}

marcarMoneda();
mostrarNombreEmpresa();
