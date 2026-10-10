// ===== VARIABLE =====

let serviciosDisponibles = [];
let clientesDisponibles = [];

// ===== FUNCIONES REUTILIZABLES =====

function actualizarCotizacion() {
  const borradorActual = leerBorrador();
  mostrarClienteDom(borradorActual.cliente);
  mostrarCotizacionDom(borradorActual.servicios);
  mostrarResumenDom(borradorActual.servicios);
}

function resetearCotizador() {
  localStorage.removeItem(CLAVE_BORRADOR);
  inputVigencia.value = '';
  actualizarCotizacion();
}

// ===== DOM MODAL COTIZADOR=====

function crearFilaServicio(servicio) {
  // MODAL AGREGAR SERVICIO
  return `    
    <div class="fila-resultado">
      <div>
        <h3 class="fila-servicio-nombre">${servicio.nombre}</h3>
        <p class="card-text">${servicio.categoria} · USD ${servicio.precio} / ${servicio.unidad}</p>
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

// Boton agregar servicio en modal

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
      mostrarAviso('La cantidad mínima es 1');
      return;
    }
    agregarServicioAlBorrador(servicioEncontrado, valorConvertido);

    actualizarCotizacion();
  }
});

// =====  DOM COTIZADOR =====

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

function crearFilaCotizacion(servicio) {
  const subtotal = calcularMonto(servicio);
  return `
    <article class="fila-servicio-cotizacion">
        <div>
            <h3 class="fila-servicio-nombre">${servicio.nombre}</h3>
            <p class="card-text">${servicio.categoria} · USD ${servicio.precio} / ${servicio.unidad}</p>
        </div>
        <div class="fila-servicio-controles">
            <div class="box-cantidad-inline">
                <label for="cant-${servicio.id}">Cant.</label>
                <input type="number" id="cant-${servicio.id}" data-id="${servicio.id}" value="${servicio.cantidad}" min="1" class="input-cantidad-cotizacion">
            </div>
            <span class="monto">${formatearMoneda(subtotal)}</span>
            <button type="button" class="btn-icono btn-quitar-servicio" data-id="${servicio.id}" aria-label="Quitar ${servicio.nombre}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    </article>
  `;
}

// Modificar total con el input

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
        mostrarAviso('La cantidad mínima es 1');
      }
      itemEncontrado.cantidad = valueInput;
      guardarEnStorage(CLAVE_BORRADOR, borradorActual);

      actualizarCotizacion();
    }
  }
});

// Boton para quitar el servicio de la fila

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

// RESUMEN DEL COTIZADOR (ASIDE)

function crearItemResumen(servicio) {
  const montoServicios = calcularMonto(servicio);

  return `<li>
              <span>${servicio.nombre}</span>
              <span>${formatearMoneda(montoServicios)}</span>
          </li>`;
}

function mostrarResumenDom(servicios) {
  const { subtotal, descuento, impuesto, total } = calcularTotal(
    servicios,
    DESCUENTO_POR_DEFECTO,
    IMPUESTO_POR_DEFECTO,
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

// Input fecha de vigencia
const inputVigencia = document.getElementById('fecha-vigencia');
inputVigencia.addEventListener('change', () => {
  const borradorActual = leerBorrador();
  borradorActual.vigencia = inputVigencia.value;
  guardarEnStorage(CLAVE_BORRADOR, borradorActual);
});

// Boton vaciar cotizacion (ASIDE)
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

// Boton confirmar cotizacion (ASIDE)
const btnConfirmar = document.getElementById('btn-confirmar');
btnConfirmar.addEventListener('click', () => {
  const borradorActual = leerBorrador();
  if (borradorActual.cliente === null) {
    mostrarAviso('Seleccioná un cliente para continuar');
    return;
  }
  if (borradorActual.servicios.length === 0) {
    mostrarAviso('Debés seleccionar como mínimo 1 servicio');
    return;
  }
  if (inputVigencia.value === '') {
    mostrarAviso('Debés colocar una fecha');
    return;
  }
  if (borradorActual.vigencia < inputVigencia.min) {
    mostrarAviso('La fecha no puede ser anterior a hoy');
    return;
  }
  const { subtotal, descuento, impuesto, total } = calcularTotal(
    borradorActual.servicios,
    DESCUENTO_POR_DEFECTO,
    IMPUESTO_POR_DEFECTO,
  );

  const cotizacionNueva = {
    id: generarId(),
    numeroCotizacion: generarNumeroCotizacion(),
    fecha: new Date().toLocaleDateString('en-CA'),
    validoHasta: borradorActual.vigencia,
    estado: 'pendiente',
    cliente: borradorActual.cliente,
    servicios: [...borradorActual.servicios],
    porcentajeDescuento: DESCUENTO_POR_DEFECTO,
    porcentajeImpuesto: IMPUESTO_POR_DEFECTO,
    subtotal,
    descuento,
    impuesto,
    total,
  };

  const historial = leerStorage(CLAVE_HISTORIAL_COTIZACIONES, []);
  historial.push(cotizacionNueva);
  guardarEnStorage(CLAVE_HISTORIAL_COTIZACIONES, historial);
  resetearCotizador();
  mostrarAviso('Cotización confirmada');
});
// ARMADO BOX CLIENTES

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

// Boton seleccionar cliente (MODAL)

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

// Boton quitar cliente (TARJETA)
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
          <div class="box-cliente-datos">
            <div><span class="dato-label">Empresa: </span>${cliente.nombre}</div>
            <div><span class="dato-label">Email: </span>${cliente.email}</div>
            <div><span class="dato-label">Ciudad: </span>${cliente.ciudad || 'sin ciudad'}</div>
            <div><span class="dato-label">Teléfono: </span>${cliente.telefono}</div>
          </div>
          <div class="box-cliente-acciones">
            <button type="button" class="btn-link" data-bs-toggle="modal" data-bs-target="#modalSeleccionarCliente">Cambiar cliente</button>
            <button type="button" class="btn-link btn-link--peligro btn-quitar-cliente">Quitar</button>
          </div>
          `;
}

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

async function iniciarCotizador() {
  serviciosDisponibles = await traerTodosLosServicios();
  clientesDisponibles = await traerTodosLosClientes();
  renderizarLista(
    clientesDisponibles,
    crearFilaCliente,
    'box-resultados-clientes',
  );

  inputVigencia.min = new Date().toLocaleDateString('en-CA');
  const borradorInicial = leerBorrador();
  inputVigencia.value = borradorInicial.vigencia;
  mostrarServiciosDom(serviciosDisponibles);
  actualizarCotizacion();
}

iniciarCotizador();
