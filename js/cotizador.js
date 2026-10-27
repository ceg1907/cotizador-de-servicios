// ===== VARIABLE =====

let serviciosDisponibles = [];
let clientesDisponibles = [];

// ===== CONTENEDORES FILTROS =====
const selectCategoriaModal = document.getElementById('filtro-categoria-modal');
escucharEvento('filtro-categoria-modal', 'click', filtrarServiciosModal);

const inputServicioModal = document.getElementById('buscar-servicio-modal');
escucharEvento('buscar-servicio-modal', 'input', filtrarServiciosModal);

// ===== FUNCIONES REUTILIZABLES =====

function mostrarFechaHoy() {
  const contenedorFecha = document.getElementById('fecha-hoy');
  contenedorFecha.textContent = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ACTUALIZAR DATOS Y DOM (COTIZADOR)

function actualizarCotizacion() {
  const borradorActual = leerBorrador();
  mostrarClienteDom(borradorActual.cliente);
  mostrarCotizacionDom(borradorActual.servicios);
  mostrarResumenDom(
    borradorActual.servicios,
    borradorActual.descuento ?? DESCUENTO_POR_DEFECTO,
  );

  const pastillaBorrador = document.getElementById('aviso-borrador');

  hayCotizacionEnCurso()
    ? pastillaBorrador.classList.remove('d-none')
    : pastillaBorrador.classList.add('d-none');

  const boxNumCot = document.getElementById('numero-cotizacion-resumen');
  boxNumCot.textContent = formatearNumeroCotizacion(generarNumeroCotizacion());
}

// RESETEAR VALORES DEL COTIZADOR

function resetearCotizador() {
  localStorage.removeItem(CLAVE_BORRADOR);
  inputDescuento.value = 0;
  inputVigencia.value = '';
  actualizarCotizacion();
}

// ===== DOM COTIZADOR (MODAL) =====

// CREAR FILA (MODAL)

function crearFilaServicio(servicio) {
  return `    
    <div class="fila-resultado">
      <div>
        <h3 class="fila-servicio-nombre">${servicio.nombre}</h3>
        <p class="card-text">${servicio.categoria} · ${formatearMoneda(servicio.precio)} / ${servicio.unidad}</p>
      </div>
      <div class="fila-resultado-controles">
        <input type="number" value="1" min="1">
        <button type="button" class="btn-primario btn-agregar-servicio" data-id="${servicio.id}">Agregar</button>
      </div>
    </div>
    `;
}

function mostrarServiciosDom(servicios) {
  renderizarLista(servicios, crearFilaServicio, 'box-resultados-servicios');
}

// BOTÓN AGREGAR SERVICIO (MODAL)

const contenedorModal = document.getElementById('box-resultados-servicios');
contenedorModal.addEventListener('click', (evento) => {
  const detectarBoton = evento.target.closest('.btn-agregar-servicio');
  if (detectarBoton !== null) {
    const idBtnServicio = detectarBoton.dataset.id;
    const idConvertido = Number(idBtnServicio);

    const detectarInputServicio = evento.target.closest(
      '.fila-resultado-controles',
    );
    const servicioEncontrado = serviciosDisponibles.find(
      (servicio) => servicio.id === idConvertido,
    );
    const inputServicio = detectarInputServicio.querySelector('input');
    const valorConvertido = Number(inputServicio.value);
    if (valorConvertido < 1) {
      mostrarAviso('La cantidad mínima es 1.');
      return;
    }
    agregarServicioAlBorrador(servicioEncontrado, valorConvertido);

    actualizarCotizacion();
  }
});

// =====  DOM COTIZADOR =====

// AGREGAR SERVICIOS AL BORRADOR

function agregarServicioAlBorrador(servicio, valorCantidad) {
  const borradorActual = leerBorrador();
  const itemExistente = borradorActual.servicios.find(
    (item) => item.id === servicio.id,
  );
  if (itemExistente) {
    itemExistente.cantidad += valorCantidad;
    guardarEnStorage(CLAVE_BORRADOR, borradorActual);
    return;
  }
  const itemNuevo = { ...servicio, cantidad: valorCantidad };
  borradorActual.servicios.push(itemNuevo);
  guardarEnStorage(CLAVE_BORRADOR, borradorActual);
}

// CREAR LA FILA EN EL DOM DEL BORRADOR

function crearFilaCotizacion(servicio, indice) {
  const subtotal = calcularMonto(servicio);
  return `
    <article class="fila-servicio-cotizacion">
      <div class="fila-servicio-info">
        <span class="numero-fila">${indice + 1}</span>
        <div>
          <h3 class="fila-servicio-nombre">${servicio.nombre}</h3>
          <p class="card-text">${servicio.categoria} · ${formatearMoneda(servicio.precio)} / ${servicio.unidad}</p>
        </div>
      </div>
      <div class="fila-servicio-controles">
        <div class="box-cantidad-inline">
          <label for="cant-${servicio.id}">Cant.</label>
          <input type="number" id="cant-${servicio.id}" data-id="${servicio.id}" value="${servicio.cantidad}" min="1" class="input-cantidad-cotizacion">
        </div>
        <span class="monto">${formatearMoneda(subtotal)}</span>
        <button type="button" class="btn-icono btn-quitar-servicio" data-id="${servicio.id}" aria-label="Quitar ${servicio.nombre}">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>
    </article>
  `;
}

// MODIFICAR TOTAL CON INPUT

const boxFilaCotizador = document.getElementById('box-lista-cotizacion');
boxFilaCotizador.addEventListener('change', (evento) => {
  const detectarInput = evento.target.closest('.input-cantidad-cotizacion');
  if (detectarInput !== null) {
    const idInputFila = Number(detectarInput.dataset.id);
    let valueInput = Number(detectarInput.value);

    const borradorActual = leerBorrador();
    const itemEncontrado = borradorActual.servicios.find(
      (servicio) => servicio.id === idInputFila,
    );
    if (itemEncontrado) {
      if (valueInput < 1) {
        valueInput = 1;
        mostrarAviso('La cantidad mínima es 1.');
      }
      itemEncontrado.cantidad = valueInput;
      guardarEnStorage(CLAVE_BORRADOR, borradorActual);

      actualizarCotizacion();
    }
  }
});

// BOTON QUITAR SERVICIO DE LA FILA

boxFilaCotizador.addEventListener('click', (evento) => {
  const detectarBtnEliminar = evento.target.closest('.btn-quitar-servicio');
  if (detectarBtnEliminar) {
    const idBtnEliminar = Number(detectarBtnEliminar.dataset.id);
    const borradorActual = leerBorrador();
    borradorActual.servicios = borradorActual.servicios.filter(
      (servicio) => servicio.id !== idBtnEliminar,
    );
    guardarEnStorage(CLAVE_BORRADOR, borradorActual);
    actualizarCotizacion();
  }
});

// MENSAJE POR SI LA COTIZACIÓN ESTA VACÍA

function mostrarCotizacionDom(servicios) {
  if (servicios.length === 0) {
    mostrarMensajeVacio(
      'box-lista-cotizacion',
      'Todavía no agregaste ningún servicio a la cotización. Hacé clic en "Agregar servicio" para empezar.',
    );
    return;
  }
  renderizarLista(servicios, crearFilaCotizacion, 'box-lista-cotizacion');
}

// ===== RESUMEN DEL COTIZADOR (ASIDE) =====

// MOSTRAR EN RESUMEN LOS SERVICIOS SELECCIONADOS

function crearItemResumen(servicio) {
  const montoServicios = calcularMonto(servicio);

  return `<li>
              <span>${servicio.nombre}</span>
              <span>${formatearMoneda(montoServicios)}</span>
          </li>`;
}

function mostrarResumenDom(servicios, porcentajeDescuento) {
  const { subtotal, descuento, impuesto, total } = calcularTotal(
    servicios,
    porcentajeDescuento,
    obtenerImpuesto(),
  );
  renderizarLista(servicios, crearItemResumen, 'box-items-cotizacion');

  document.getElementById('num-subtotal').textContent =
    formatearMoneda(subtotal);
  document.getElementById('num-descuento').textContent =
    formatearMoneda(descuento);
  document.getElementById('num-impuesto').textContent =
    formatearMoneda(impuesto);
  document.getElementById('num-total').textContent = formatearMoneda(total);
}

// INPUT FECHA DE VIGENCIA
const inputVigencia = document.getElementById('fecha-vigencia');
inputVigencia.addEventListener('change', () => {
  const borradorActual = leerBorrador();
  borradorActual.vigencia = inputVigencia.value;
  guardarEnStorage(CLAVE_BORRADOR, borradorActual);
});

// INPUT PORCENTAJE DE DESCUENTO
const inputDescuento = document.getElementById('input-descuento');
inputDescuento.addEventListener('input', () => {
  const borradorActual = leerBorrador();
  const descuentoEnNum = Number(inputDescuento.value);

  if (descuentoEnNum < 0 || descuentoEnNum > 100) {
    mostrarAviso('Escribí un número entre 0 y 100.');
    return;
  }
  borradorActual.descuento = descuentoEnNum;
  guardarEnStorage(CLAVE_BORRADOR, borradorActual);
  actualizarCotizacion();
});

// BOTÓN VACIAR COTIZACIÓN (ASIDE)
const btnVaciar = document.getElementById('btn-vaciar');
btnVaciar.addEventListener('click', async () => {
  const response = await modalCotizador.fire({
    icon: 'warning',
    title: '¿Vaciar la cotización?',
    text: 'Se van a quitar todos los servicios, el cliente y la vigencia de la cotización.',
    showCancelButton: true,
    confirmButtonText: 'Sí, vaciar',
    cancelButtonText: 'Cancelar',
  });
  if (response.isConfirmed) {
    resetearCotizador();
  }
});

// BOTON CONFIRMAR COTIZACIÓN (ASIDE)
const btnConfirmar = document.getElementById('btn-confirmar');
btnConfirmar.addEventListener('click', async () => {
  const borradorActual = leerBorrador();
  if (borradorActual.cliente === null) {
    mostrarAviso('Seleccioná un cliente para continuar.');
    return;
  }
  if (borradorActual.servicios.length === 0) {
    mostrarAviso('Agregá al menos un servicio.');
    return;
  }
  if (inputVigencia.value === '') {
    mostrarAviso('Elegí hasta qué fecha es válida la cotización.');
    return;
  }
  if (borradorActual.vigencia < inputVigencia.min) {
    mostrarAviso('La fecha no puede ser anterior a hoy.');
    return;
  }
  const { subtotal, descuento, impuesto, total } = calcularTotal(
    borradorActual.servicios,
    borradorActual.descuento ?? DESCUENTO_POR_DEFECTO,
    obtenerImpuesto(),
  );

  const cotizacionNueva = {
    id: generarId(),
    numeroCotizacion: generarNumeroCotizacion(),
    fecha: new Date().toLocaleDateString('en-CA'),
    validoHasta: borradorActual.vigencia,
    estado: 'pendiente',
    cliente: borradorActual.cliente,
    servicios: [...borradorActual.servicios],
    porcentajeDescuento: borradorActual.descuento ?? DESCUENTO_POR_DEFECTO,
    porcentajeImpuesto: obtenerImpuesto(),
    subtotal,
    descuento,
    impuesto,
    total,
  };

  const historial = leerStorage(CLAVE_HISTORIAL_COTIZACIONES, []);
  historial.push(cotizacionNueva);
  guardarEnStorage(CLAVE_HISTORIAL_COTIZACIONES, historial);
  resetearCotizador();
  const response = await modalCotizador.fire({
    icon: 'success',
    title: '¡Cotización confirmada!',
    text: 'Se guardó en el historial. ¿Querés descargar el PDF ahora?',
    showCancelButton: true,
    confirmButtonText: 'Descargar PDF',
    cancelButtonText: 'Entendido',
  });
  if (response.isConfirmed) {
    generarPdfCotizacion(cotizacionNueva);
  }
});

// ARMADO FILA CLIENTES

function crearFilaCliente(cliente) {
  return `
    <div class="fila-resultado">
      <div>
        <h3 class="fila-servicio-nombre">${cliente.nombre}</h3>
        <p class="card-text">${cliente.email} · ${cliente.ciudad || 'sin ciudad'}</p>
      </div>
      <button type="button" class="btn-primario btn-seleccionar-cliente" data-id="${cliente.id}">
      Seleccionar
      </button>
    </div>
  `;
}

// BOTÓN SELECCIONAR CLIENTE (MODAL)

const contenedorClientes = document.getElementById('box-resultados-clientes');
contenedorClientes.addEventListener('click', (evento) => {
  const detectarBtnCliente = evento.target.closest('.btn-seleccionar-cliente');
  if (detectarBtnCliente) {
    const idCliente = Number(detectarBtnCliente.dataset.id);
    const clienteEncontrado = clientesDisponibles.find(
      (cliente) => cliente.id === idCliente,
    );
    const borradorActual = leerBorrador();
    borradorActual.cliente = clienteEncontrado;
    guardarEnStorage(CLAVE_BORRADOR, borradorActual);
    actualizarCotizacion();
    const modalClientes = bootstrap.Modal.getOrCreateInstance(
      document.getElementById('modalSeleccionarCliente'),
    );
    modalClientes.hide();
  }
});

// BOTÓN QUITAR CLIENTE (TARJETA)
const boxClienteDinamico = document.getElementById('box-cliente-dinamico');
boxClienteDinamico.addEventListener('click', (evento) => {
  const detectarBtnQuitar = evento.target.closest('.btn-quitar-cliente');
  if (detectarBtnQuitar) {
    const borradorActual = leerBorrador();
    borradorActual.cliente = null;
    guardarEnStorage(CLAVE_BORRADOR, borradorActual);
    actualizarCotizacion();
  }
});

// CREACION TARJETA CLIENTE

function crearTarjetaCliente(cliente) {
  return `
    <div class="tarjeta-cliente">
      <span class="avatar" aria-hidden="true">${obtenerIniciales(cliente.nombre)}</span>
      <div class="tarjeta-cliente-datos">
        <strong>${cliente.nombre}</strong>
        <span>${cliente.email}</span>
        <small>${cliente.ciudad || 'Sin ciudad'} · ${cliente.telefono}</small>
      </div>
      <div class="tarjeta-cliente-acciones">
        <button type="button" class="btn-link" data-bs-toggle="modal" data-bs-target="#modalSeleccionarCliente">Cambiar</button>
        <button type="button" class="btn-icono btn-quitar-cliente" aria-label="Quitar cliente">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    </div>
  `;
}

// MENSAJE SI NO HAY CLIENTE CARGADO

function mostrarClienteDom(cliente) {
  const boxClientes = document.getElementById('box-cliente-dinamico');

  if (cliente === null) {
    mostrarMensajeVacio(
      'box-cliente-dinamico',
      'Todavía no seleccionaste un cliente para esta cotización.',
      'texto-ayuda',
    );
    return;
  }
  boxClientes.innerHTML = crearTarjetaCliente(cliente);
}

// FUNCIONES QUE FILTRAN

function filtrarServiciosModal() {
  const serviciosPorCategoria = aplicarFiltro(
    serviciosDisponibles,
    selectCategoriaModal.value,
    (servicio) => servicio.categoria === selectCategoriaModal.value,
  );

  const textoBuscado = formatearTexto(inputServicioModal.value);
  const serviciosBuscados = aplicarFiltro(
    serviciosPorCategoria,
    textoBuscado,
    (servicio) =>
      formatearTexto(servicio.nombre).includes(textoBuscado) ||
      formatearTexto(servicio.categoria).includes(textoBuscado),
  );

  if (serviciosBuscados.length === 0) {
    mostrarMensajeVacio(
      'box-resultados-servicios',
      'No encontramos servicios con ese nombre o categoría. Probá con otra búsqueda.',
    );
    return;
  }

  mostrarServiciosDom(serviciosBuscados);
}

// ====== FUNCIONES INICIADORAS =====

async function iniciarCotizador() {
  serviciosDisponibles = await traerTodosLosServicios();

  const categoriasEncontradas = traerCategorias(serviciosDisponibles);

  categoriasEncontradas.forEach((categoria) => {
    selectCategoriaModal.innerHTML += crearOpcionCategoria(categoria);
  });

  clientesDisponibles = await traerTodosLosClientes();
  mostrarFechaHoy();
  renderizarLista(
    clientesDisponibles,
    crearFilaCliente,
    'box-resultados-clientes',
  );

  inputVigencia.min = new Date().toLocaleDateString('en-CA');
  const borradorInicial = leerBorrador();
  inputVigencia.value = borradorInicial.vigencia;
  inputDescuento.value = borradorInicial.descuento ?? DESCUENTO_POR_DEFECTO;
  mostrarServiciosDom(serviciosDisponibles);
  actualizarCotizacion();
}

iniciarCotizador();
