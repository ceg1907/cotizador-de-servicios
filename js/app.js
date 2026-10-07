// ===== VARIABLES ====

const CLAVE_SERVICIOS = 'serviciosCargados';
const CLAVE_CLIENTES = 'clientesCargados';
const CLAVE_HISTORIAL_COTIZACIONES = 'historialCotizaciones';
const CLAVE_BORRADOR = 'borradorEnCurso';
const CLAVE_EMPRESA = 'datosEmpresa';

const IMPUESTO_POR_DEFECTO = 21;
const DESCUENTO_POR_DEFECTO = 0;

// ===== FUNCIONES REUTILIZABLES =====

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

// COMBINAR ARRAYS

function combinarDb(dataBase1, dataBase2) {
  const dataBaseComp = [...dataBase1, ...dataBase2];
  return dataBaseComp;
}

// LEER DATOS DEL BORRADOR

function leerBorrador() {
  const borradorGuardado = leerStorage(CLAVE_BORRADOR, {
    cliente: null,
    servicios: [],
    vigencia: '',
  });
  return borradorGuardado;
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

// FUNCION CREAR FILAS

function renderizarLista(items, crearFila, idContenedor) {
  let itemsDom = '';
  items.forEach((item) => {
    itemsDom += crearFila(item);
  });

  const idBox = document.getElementById(idContenedor);
  idBox.innerHTML = itemsDom;
}

// ===== FORMATO DE MONEDA =====

const formatoDolares = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
});

function formatearMoneda(numero) {
  return formatoDolares.format(numero);
}

// ===== SERVICIOS =====

async function traerServicios() {
  try {
    const serviciosDb = await fetch('data/servicios.json');
    const servicios = await serviciosDb.json();
    return servicios;
  } catch (error) {
    console.error(error);
  }
}

async function traerTodosLosServicios() {
  const serviciosDelJson = await traerServicios();
  const serviciosDelStorage = leerStorage(CLAVE_SERVICIOS, []);
  const todosLosServicios = combinarDb(serviciosDelJson, serviciosDelStorage);
  return todosLosServicios;
}

// ===== CLIENTES =====

async function traerClientes() {
  try {
    const clientesDb = await fetch('data/clientes.json');
    const clientes = await clientesDb.json();
    return clientes;
  } catch (error) {
    console.error(error);
  }
}

async function traerTodosLosClientes() {
  const clientesdelJson = await traerClientes();
  const clientesDelStorage = leerStorage(CLAVE_CLIENTES, []);
  const todosLosClientes = combinarDb(clientesdelJson, clientesDelStorage);
  return todosLosClientes;
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

function formatearNumeroCotizacion(numero) {
  return `COT-${String(numero).padStart(4, '0')}`;
}

function formatearFecha(fechaGuardada) {
  const partes = fechaGuardada.split('-');
  const partesInvertidas = partes.reverse();
  return partesInvertidas.join('/');
}
