// ===== VARIABLES ====

const CLAVE_SERVICIOS = 'serviciosCargados';
const CLAVE_CLIENTES = 'clientesCargados';
const CLAVE_HISTORIAL_COTIZACIONES = 'historialCotizaciones';
const CLAVE_BORRADOR = 'borradorEnCurso';
const CLAVE_EMPRESA = 'datosEmpresa';
const CLAVE_MONEDA = 'monedaSeleccionada';

const IMPUESTO_POR_DEFECTO = 21;
const COLOR_MARCA_POR_DEFECTO = '#1b4c39';
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

const modalPeligro = modalCotizador.mixin({
  icon: 'warning',
  showCancelButton: true,
  cancelButtonText: 'Cancelar',
  customClass: {
    popup: 'modal-cotizador',
    confirmButton: 'btn-primario btn-peligro-solido',
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
  items.forEach((item, indice) => {
    itemsDom += crearFila(item, indice);
  });

  const idBox = document.getElementById(idContenedor);
  idBox.innerHTML = itemsDom;
}

function obtenerIniciales(nombre) {
  const inicialesNombre = nombre
    .split(' ')
    .slice(0, 2)
    .map((palabra) => palabra[0])
    .join('')
    .toUpperCase();
  return inicialesNombre;
}

// CATEGORIA (SELECT)

function crearOpcionCategoria(categoria) {
  return `
          <option value="${categoria}">${categoria}</option>
  `;
}

// FILTROS DE HISTORIAL (SELEC Y BUSCADOR)

function aplicarFiltro(lista, valor, condicion) {
  const listaFiltrada = valor === 'todos' ? lista : lista.filter(condicion);
  return listaFiltrada;
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

// AVISO DE BORRADOR EN CURSO

async function avisarCotizacionEnCurso() {
  const estaEnCotizador = document.getElementById('btn-confirmar');
  if (estaEnCotizador) {
    return;
  }

  if (!hayCotizacionEnCurso()) {
    return;
  }

  const avisoYaMostrado = sessionStorage.getItem('avisoCotizacionMostrado');
  if (avisoYaMostrado) {
    return;
  }
  sessionStorage.setItem('avisoCotizacionMostrado', 'true');

  const response = await Swal.fire({
    toast: true,
    position: 'bottom-end',
    icon: 'info',
    iconHtml: `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>`,
    title: 'Tenés una cotización en curso',
    text: 'Podés retomarla cuando quieras.',
    showConfirmButton: true,
    confirmButtonText: 'Ver cotización',
    showCloseButton: true,
    buttonsStyling: false,
    customClass: {
      popup: 'toast-cotizador toast-en-curso',
      icon: 'icono-toast',
      confirmButton: 'btn-enlace',
    },
  });

  if (response.isConfirmed) {
    location.href = '../index.html';
  }
}

function hayCotizacionEnCurso() {
  const borradorActual = leerBorrador();

  return borradorActual.cliente !== null || borradorActual.servicios.length > 0;
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

// COLORES DEL PDF

function aclararColor(colorHex, porcentaje) {
  const rojo = parseInt(colorHex.slice(1, 3), 16);
  const verde = parseInt(colorHex.slice(3, 5), 16);
  const azul = parseInt(colorHex.slice(5, 7), 16);
  const mezclar = (canal) =>
    Math.round(canal + (255 - canal) * (1 - porcentaje / 100));
  return [mezclar(rojo), mezclar(verde), mezclar(azul)];
}

// CAJITAS DE DATOS DEL PDF

function dibujarCajaDato(
  documento,
  x,
  ancho,
  titulo,
  valor,
  colorMarca,
  colorSuave,
  centrado = false,
) {
  documento.setFillColor(...colorSuave);
  documento.roundedRect(x, 54, ancho, 26, 2.5, 2.5, 'F');

  const xTexto = centrado ? x + ancho / 2 : x + 5;
  const alineacion = centrado ? 'center' : 'left';
  const yTitulo = centrado ? 64 : 61;
  const yValor = centrado ? 71 : 68;

  documento.setFont('helvetica', 'bold');
  documento.setFontSize(7);
  documento.setTextColor(colorMarca);
  const espacioLetras = 0.5;
  const correccion = centrado ? (espacioLetras * (titulo.length - 1)) / 2 : 0;
  documento.text(titulo, xTexto - correccion, yTitulo, {
    align: alineacion,
    charSpace: espacioLetras,
  });

  documento.setFontSize(11);
  documento.setTextColor('#2B3640');
  documento.text(valor, xTexto, yValor, { align: alineacion });
}

// ENCABEZADO DEL PDF

function dibujarEncabezadoPdf(documento, datosEmpresa, numeroCotizacion) {
  const {
    nombre: nombreEmpresa,
    telefono: telefonoEmpresa,
    email: emailEmpresa,
    direccion: direccionEmpresa,
    logo: logoEmpresa,
    color: colorEmpresa,
  } = datosEmpresa;
  const colorMarca = colorEmpresa || COLOR_MARCA_POR_DEFECTO;

  // Banda de color
  documento.setFillColor(colorMarca);
  documento.rect(0, 0, 210, 44, 'F');

  let inicioTexto = 20;
  if (logoEmpresa) {
    const propiedades = documento.getImageProperties(logoEmpresa);
    const escala = Math.min(50 / propiedades.width, 20 / propiedades.height);
    const anchoLogo = propiedades.width * escala;
    const altoLogo = propiedades.height * escala;

    const margenCaja = 1.5;
    const anchoCaja = anchoLogo + margenCaja * 2;
    const altoCaja = altoLogo + margenCaja * 2;
    const yCaja = 22 - altoCaja / 2;

    documento.setFillColor('#FFFFFF');
    documento.roundedRect(20, yCaja, anchoCaja, altoCaja, 2, 2, 'F');
    documento.addImage(
      logoEmpresa,
      propiedades.fileType,
      20 + margenCaja,
      yCaja + margenCaja,
      anchoLogo,
      altoLogo,
    );

    inicioTexto = 20 + anchoCaja + 8;
  }

  // Nombre y contacto de la empresa
  documento.setTextColor('#FFFFFF');
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(16);
  documento.text(nombreEmpresa || 'Nombre empresa', inicioTexto, 20);

  documento.setFont('helvetica', 'normal');
  documento.setFontSize(9);
  const contacto = [emailEmpresa, telefonoEmpresa]
    .filter((dato) => dato)
    .join('  ·  ');
  if (contacto) {
    documento.text(contacto, inicioTexto, 27);
  }
  if (direccionEmpresa) {
    documento.text(direccionEmpresa, inicioTexto, 32);
  }

  // Número de presupuesto
  documento.setFontSize(8);
  documento.text('PRESUPUESTO', 190, 19, { align: 'right' });
  documento.setFont('helvetica', 'bold');
  documento.setFontSize(20);
  documento.text(formatearNumeroCotizacion(numeroCotizacion), 190, 29, {
    align: 'right',
  });
}

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
  const colorMarca = datosEmpresa.color || COLOR_MARCA_POR_DEFECTO;
  const colorSuave = aclararColor(colorMarca, 10);
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

  dibujarEncabezadoPdf(documento, datosEmpresa, numeroCotizacion);

  // Cajitas: cliente y fechas
  dibujarCajaDato(
    documento,
    20,
    82,
    'PREPARADO PARA',
    nombre,
    colorMarca,
    colorSuave,
  );
  dibujarCajaDato(
    documento,
    106,
    40,
    'FECHA DE EMISIÓN',
    formatearFecha(fecha),
    colorMarca,
    colorSuave,
    true,
  );
  dibujarCajaDato(
    documento,
    150,
    40,
    'VÁLIDO HASTA',
    formatearFecha(validoHasta),
    colorMarca,
    colorSuave,
    true,
  );

  documento.setFont('helvetica', 'normal');
  documento.setFontSize(8.5);
  documento.setTextColor('#5F6C75');
  const contactoCliente = [email, telefono]
    .filter((dato) => dato)
    .join('  ·  ');
  const ubicacionCliente = [direccion, ciudad]
    .filter((dato) => dato)
    .join(', ');
  documento.text(contactoCliente, 25, 73.5);
  documento.text(ubicacionCliente, 25, 77.5, { maxWidth: 72 });

  // Saludo
  documento.setFontSize(10);
  documento.text(
    `Hola ${nombre}, gracias por tu consulta. Te compartimos el detalle de los servicios:`,
    20,
    92,
    { maxWidth: 170 },
  );

  // Tabla de servicios cotizados
  documento.autoTable({
    startY: 99,
    margin: { left: 20, right: 20, bottom: 25 },
    head: [
      [
        'Servicio',
        { content: 'Cantidad', styles: { halign: 'center' } },
        { content: 'Precio unitario', styles: { halign: 'right' } },
        { content: 'Subtotal', styles: { halign: 'right' } },
      ],
    ],
    body: servicios.map((servicio) => [
      servicio.nombre,
      formatearCantidad(servicio.cantidad, servicio.unidad),
      formatearMoneda(servicio.precio),
      formatearMoneda(calcularMonto(servicio)),
    ]),
    theme: 'plain',
    styles: {
      font: 'helvetica',
      fontSize: 10,
      textColor: '#2B3640',
      cellPadding: { top: 4, right: 4, bottom: 7, left: 4 },
      lineColor: '#E6E2DC',
      lineWidth: { bottom: 0.3 },
    },
    headStyles: {
      fillColor: colorMarca,
      textColor: '#FFFFFF',
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 4,
      lineWidth: 0,
    },
    alternateRowStyles: { fillColor: colorSuave },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right' },
    },
    didDrawCell: (dato) => {
      if (dato.section === 'body' && dato.column.index === 0) {
        const servicio = servicios[dato.row.index];
        documento.setFontSize(8);
        documento.setTextColor('#5F6C75');
        documento.text(
          servicio.categoria,
          dato.cell.x + 4,
          dato.cell.y + dato.cell.height - 3.5,
        );
      }
    },
  });

  // ===== TOTALES =====
  const finTabla = documento.lastAutoTable.finalY;
  const hayDescuento = porcentajeDescuento > 0;
  const colorBorde = aclararColor(colorMarca, 25);

  const filasTotales = [['Subtotal', formatearMoneda(subtotal)]];
  if (hayDescuento) {
    filasTotales.push([
      `Descuento (${porcentajeDescuento}%)`,
      `- ${formatearMoneda(descuento)}`,
    ]);
  }
  filasTotales.push([
    `IVA (${porcentajeImpuesto}%)`,
    formatearMoneda(impuesto),
  ]);

  const altoFilas = 5 + filasTotales.length * 7;
  const altoTotal = 12;
  const altoCaja = altoFilas + altoTotal;
  let inicioCaja = finTabla + 8;
  if (inicioCaja + altoCaja > 272) {
    documento.addPage();
    inicioCaja = 20;
  }

  // Caja con borde
  documento.setDrawColor(...colorBorde);
  documento.setLineWidth(0.3);
  documento.roundedRect(118, inicioCaja, 72, altoCaja, 2.5, 2.5, 'S');

  documento.setFont('helvetica', 'normal');
  documento.setFontSize(9.5);
  documento.setTextColor('#2B3640');
  filasTotales.forEach(([texto, monto], indice) => {
    const y = inicioCaja + 8 + indice * 7;
    documento.text(texto, 123, y);
    documento.text(monto, 185, y, { align: 'right' });
  });

  // Franja del total
  const inicioTotal = inicioCaja + altoFilas;
  documento.setFillColor(colorMarca);
  documento.roundedRect(118, inicioTotal, 72, altoTotal, 2.5, 2.5, 'F');
  documento.rect(118, inicioTotal, 72, 3, 'F');

  documento.setFont('helvetica', 'bold');
  documento.setFontSize(12);
  documento.setTextColor('#FFFFFF');
  documento.text('Total', 123, inicioTotal + 7.8);
  documento.text(formatearMoneda(total), 185, inicioTotal + 7.8, {
    align: 'right',
  });

  // ===== CONDICIONES =====
  const monedaGuardada = leerStorage(CLAVE_MONEDA, {});
  const nombreMoneda =
    monedaGuardada.moneda === 'ARS'
      ? 'pesos argentinos'
      : 'dólares estadounidenses';
  const condiciones = [
    `Presupuesto válido hasta el ${formatearFecha(validoHasta)}. Pasada esa fecha, los precios pueden variar.`,
    `Los importes están expresados en ${nombreMoneda}.`,
  ];

  documento.setFont('helvetica', 'bold');
  documento.setFontSize(7);
  documento.setTextColor(colorMarca);
  documento.text('CONDICIONES', 20, inicioCaja + 5, { charSpace: 0.5 });

  documento.setFont('helvetica', 'normal');
  documento.setFontSize(8.5);
  documento.setTextColor('#5F6C75');
  let yCondicion = inicioCaja + 11;
  condiciones.forEach((condicion) => {
    const renglones = documento.splitTextToSize(condicion, 86);
    documento.text('•', 20, yCondicion);
    documento.text(renglones, 24, yCondicion);
    yCondicion += renglones.length * 4 + 2;
  });

  // ===== MENSAJE DE CIERRE =====
  let inicioGracias = Math.max(inicioCaja + altoCaja, yCondicion) + 14;
  if (inicioGracias + 20 > 272) {
    documento.addPage();
    inicioGracias = 20;
  }

  documento.setFillColor(...colorSuave);
  documento.roundedRect(20, inicioGracias, 170, 20, 2.5, 2.5, 'F');
  documento.setFillColor(colorMarca);
  documento.rect(20, inicioGracias, 1.5, 20, 'F');

  documento.setFont('helvetica', 'bold');
  documento.setFontSize(10.5);
  documento.setTextColor(colorMarca);
  documento.text('¡Gracias por elegirnos!', 27, inicioGracias + 8);

  documento.setFont('helvetica', 'normal');
  documento.setFontSize(8.5);
  documento.setTextColor('#5F6C75');
  documento.text(
    'Si estás de acuerdo con el presupuesto, comunicate con nosotros y coordinamos los próximos pasos.',
    27,
    inicioGracias + 14,
    { maxWidth: 158 },
  );

  // ===== PIE (en todas las páginas) =====
  const totalPaginas = documento.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    documento.setPage(pagina);

    documento.setDrawColor(colorMarca);
    documento.setLineWidth(0.6);
    documento.line(20, 279, 190, 279);

    documento.setFont('helvetica', 'bold');
    documento.setFontSize(8.5);
    documento.setTextColor(colorMarca);
    const textoNombre = nombreEmpresa || 'Nombre empresa';
    documento.text(textoNombre, 20, 285);
    const anchoNombre = documento.getTextWidth(textoNombre);

    if (datosContacto) {
      documento.setFont('helvetica', 'normal');
      documento.setTextColor('#5F6C75');
      documento.text(`  ·  ${datosContacto}`, 20 + anchoNombre, 285);
    }

    documento.setFont('helvetica', 'normal');
    documento.setTextColor('#5F6C75');
    documento.text(`Página ${pagina} de ${totalPaginas}`, 190, 285, {
      align: 'right',
    });
  }

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
avisarCotizacionEnCurso();
