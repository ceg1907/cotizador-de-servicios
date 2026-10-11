/* ============================================
           JS DEL HISTORIAL.HTML
   ============================================ */

// ===== CONTENEDORES FILTROS =====
const selectEstado = document.getElementById('filtro-estado');
escucharEvento('filtro-estado', 'change', actualizarHistorial);

const selectCategoria = document.getElementById('filtro-categoria');
escucharEvento('filtro-categoria', 'change', actualizarHistorial);

const inputBusqueda = document.getElementById('filtro-busqueda');
escucharEvento('filtro-busqueda', 'input', actualizarHistorial);

// FUNCIONES REUTILIZABLES

function aplicarFiltro(lista, valor, condicion) {
  const listaFiltrada = valor === 'todos' ? lista : lista.filter(condicion);
  return listaFiltrada;
}

function actualizarHistorial() {
  const historial = leerStorage(CLAVE_HISTORIAL_COTIZACIONES, []);

  const cotPorEstado = aplicarFiltro(
    historial,
    selectEstado.value,
    (item) => obtenerEstadoVisible(item) === selectEstado.value,
  );
  const cotPorCategoria = aplicarFiltro(
    cotPorEstado,
    selectCategoria.value,
    (cotizacion) =>
      cotizacion.servicios.some(
        (servicio) => servicio.categoria === selectCategoria.value,
      ),
  );

  const textoBuscado = formatearTexto(inputBusqueda.value);
  const cotBuscadas = aplicarFiltro(
    cotPorCategoria,
    textoBuscado,
    (cotizacion) =>
      formatearTexto(cotizacion.cliente.nombre).includes(textoBuscado) ||
      formatearTexto(formatearNumeroCotizacion(cotizacion.numeroCotizacion))
        .toLowerCase()
        .includes(textoBuscado),
  );
  if (historial.length === 0) {
    mostrarMensajeVacio(
      'box-historial-cotizacion',
      'Todavía no confirmaste ninguna cotización. Cuando confirmes una en el Cotizador, va a aparecer acá.',
    );
    return;
  }

  if (cotBuscadas.length === 0) {
    mostrarMensajeVacio(
      'box-historial-cotizacion',
      'No encontramos cotizaciones que coincidan con tu búsqueda. Probá con otro nombre, número o filtro',
    );
    return;
  }
  renderizarLista(
    cotBuscadas,
    crearTarjetaCotizacion,
    'box-historial-cotizacion',
  );
}

// FORMATEADORES

function formatearCategorias(servicios) {
  const categorias = traerCategorias(servicios);
  const textoCategorias = categorias.join(', ');

  return textoCategorias;
}

// ===== CREACION DE HTML =====

function crearTarjetaCotizacion(cotizacion) {
  const estadoVisible = obtenerEstadoVisible(cotizacion);
  return `
    <article class="card w-100 mb-3">
      <div class="card-body">
        <div>
          <h5 class="card-title"> ${formatearNumeroCotizacion(cotizacion.numeroCotizacion)} — ${formatearFecha(cotizacion.fecha)}</h5>
          <p class="card-text">${cotizacion.cliente.nombre} · ${formatearCategorias(cotizacion.servicios)}</p>
          <span class="monto">${formatearMoneda(cotizacion.total)}</span>
        </div>
        <hr class="my-2 mx-5">
        <div class="d-flex justify-content-between">
          <div class="box-estado">
            <label for="estado-${cotizacion.id}">Estado</label>
            <select id="estado-${cotizacion.id}" data-id="${cotizacion.id}" class="select-estado select-estado--${estadoVisible}">
              <option value="pendiente" ${estadoVisible === 'pendiente' ? 'selected' : ''}>Pendiente</option>
              <option value="vencida" ${estadoVisible === 'vencida' ? 'selected' : ''}>Vencida</option>
              <option value="completada" ${estadoVisible === 'completada' ? 'selected' : ''}>Completada</option>
            </select>
          </div>
          <div class="d-flex align-items-center gap-4">
            <button type="button" class="btn-texto-icono btn-pdf-cotizacion" data-id="${cotizacion.id}">
              <img src="../assets/icono-pdf.svg" alt="Descargar PDF" width="20" height="20">
              Descargar
            </button>
            <button type="button" class="btn-icono btn-eliminar-cotizacion" data-id="${cotizacion.id}" aria-label="Eliminar cotización">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>  
      </div>
    </article>
  `;
}

function crearOpcionCategoria(categoria) {
  return `
          <option value="${categoria}">${categoria}</option>
  `;
}

// ====== BOTONES ======

async function eliminarCotizacion(evento) {
  const btnEliminar = evento.target.closest('.btn-eliminar-cotizacion');
  if (btnEliminar) {
    const idBtnEliminar = Number(btnEliminar.dataset.id);
    const response = await modalCotizador.fire({
      icon: 'warning',
      title: 'Estás a punto de eliminar la cotización.',
      text: 'Estás seguro que querés borrar esta cotización?',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar de forma permanente',
      cancelButtonText: 'Cancelar',
    });
    if (response.isConfirmed) {
      const leerHistorial = leerStorage(CLAVE_HISTORIAL_COTIZACIONES, []);
      const historialActualizado = leerHistorial.filter(
        (item) => item.id !== idBtnEliminar,
      );
      guardarEnStorage(CLAVE_HISTORIAL_COTIZACIONES, historialActualizado);
      actualizarHistorial();
      mostrarAviso('Se eliminó correctamente', 'success');
    }
  }
}
escucharEvento('box-historial-cotizacion', 'click', eliminarCotizacion);

// Select de ESTADO

function cambiarEstado(evento) {
  const detectarSelect = evento.target.closest('.select-estado');

  if (detectarSelect) {
    const idSelectFila = Number(detectarSelect.dataset.id);

    const historial = leerStorage(CLAVE_HISTORIAL_COTIZACIONES, []);
    const cotEncontrada = historial.find((item) => item.id === idSelectFila);
    cotEncontrada.estado = detectarSelect.value;

    guardarEnStorage(CLAVE_HISTORIAL_COTIZACIONES, historial);

    actualizarHistorial();
  }
}
escucharEvento('box-historial-cotizacion', 'change', cambiarEstado);

// VIGENCIA DE COTIZACION

function obtenerEstadoVisible(cotizacion) {
  const fechaActual = new Date().toLocaleDateString('en-CA');
  return cotizacion.estado === 'pendiente' &&
    fechaActual > cotizacion.validoHasta
    ? 'vencida'
    : cotizacion.estado;
}

async function iniciarHistorial() {
  const serviciosCargados = await traerTodosLosServicios('../');
  const categoriasEncontradas = traerCategorias(serviciosCargados);

  categoriasEncontradas.forEach((categoria) => {
    selectCategoria.innerHTML += crearOpcionCategoria(categoria);
  });

  actualizarHistorial();
}

/* ============================================
           JS DEL ADMIN.HTML
   ============================================ */

// ====== VARIABLES ======
let serviciosDisponiblesAdmin = [];
let clientesDisponiblesAdmin = [];

// ====== ACTUALIZAR ======

// PESTAÑA SERVICIOS

const inputBusquedasServiciosAdmin = document.getElementById(
  'buscar-servicio-admin',
);
escucharEvento('buscar-servicio-admin', 'input', actualizarServiciosAdmin);

function actualizarServiciosAdmin() {
  const textoBuscado = formatearTexto(inputBusquedasServiciosAdmin.value);
  const serviciosBuscados = aplicarFiltro(
    serviciosDisponiblesAdmin,
    textoBuscado,
    (servicio) =>
      formatearTexto(servicio.nombre).includes(textoBuscado) ||
      formatearTexto(servicio.categoria).includes(textoBuscado),
  );
  if (serviciosBuscados.length === 0) {
    mostrarMensajeVacio(
      'box-lista-servicios',
      'No encontramos servicios que coincidan con tu búsqueda. Probá con otro nombre o categoría.',
    );
    return;
  }
  renderizarLista(
    serviciosBuscados,
    crearFilaServiciosAdmin,
    'box-lista-servicios',
  );
}

function actualizarCategoriasAdmin() {
  const listadoCategorias = traerCategorias(serviciosDisponiblesAdmin);
  renderizarLista(listadoCategorias, crearOpcionCategoria, 'lista-categorias');
}

// PESTAÑA CLIENTES

const inputBusquedaClientesAdmin = document.getElementById(
  'buscar-cliente-admin',
);
escucharEvento('buscar-cliente-admin', 'input', actualizarClientesAdmin);

function actualizarClientesAdmin() {
  const textoBuscado = formatearTexto(inputBusquedaClientesAdmin.value);
  const clientesBuscados = aplicarFiltro(
    clientesDisponiblesAdmin,
    textoBuscado,
    (cliente) =>
      formatearTexto(cliente.nombre).includes(textoBuscado) ||
      formatearTexto(cliente.email).includes(textoBuscado) ||
      formatearTexto(cliente.ciudad).includes(textoBuscado),
  );
  if (clientesBuscados.length === 0) {
    mostrarMensajeVacio(
      'box-lista-clientes',
      'No encontramos clientes que coincidan con tu búsqueda. Probá con otro nombre, email o ciudad.',
    );
    return;
  }
  renderizarLista(
    clientesBuscados,
    crearFilaClientesAdmin,
    'box-lista-clientes',
  );
}

//  ===== MANIPULACION DE DOM =====

// PESTAÑA SERVICIOS

function crearFilaServiciosAdmin(servicio) {
  return `
     <article class="fila-admin">
       <div>
           <h3 class="fila-servicio-nombre">${servicio.nombre}</h3>
           <p class="card-text">${servicio.categoria} · por ${servicio.unidad}</p>
       </div>
       <div class="fila-admin-controles">
           <span class="monto">${formatearMoneda(servicio.precio)}</span>
           <button type="button" data-id="${servicio.id}" class="btn-icono btn-eliminar-servicio-admin" aria-label="Eliminar ${servicio.nombre}">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <line x1="18" y1="6" x2="6" y2="18"></line>
                   <line x1="6" y1="6" x2="18" y2="18"></line>
               </svg>
           </button>
       </div>
   </article>
  `;
}

// PESTAÑA CLIENTES
function crearFilaClientesAdmin(cliente) {
  return `
     <article class="fila-admin">
       <div>
           <h3 class="fila-servicio-nombre">${cliente.nombre}</h3>
           <p class="card-text">${cliente.email} · ${cliente.ciudad || 'sin ciudad'}</p>
       </div>
       <div class="fila-admin-controles">
           <span class="card-text">${cliente.telefono}</span>
           <button type="button" data-id="${cliente.id}" class="btn-icono btn-eliminar-cliente-admin" aria-label="Eliminar cliente ${cliente.nombre}">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <line x1="18" y1="6" x2="6" y2="18"></line>
                   <line x1="6" y1="6" x2="18" y2="18"></line>
               </svg>
           </button>
       </div>
   </article>
  `;
}

// ====== BOTONES ======

// BOTON ELIMINA SERVICIO (PESTAÑA SERVICIOS)

async function eliminarServicioAdmin(evento) {
  const btnEliminar = evento.target.closest('.btn-eliminar-servicio-admin');
  if (btnEliminar) {
    const idBtnEliminar = Number(btnEliminar.dataset.id);
    const response = await modalCotizador.fire({
      icon: 'warning',
      title: 'Estás a punto de eliminar este servicio.',
      text: '¿Estás seguro de que querés borrarlo?',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar de forma permanente',
      cancelButtonText: 'Cancelar',
    });
    if (response.isConfirmed) {
      serviciosDisponiblesAdmin = serviciosDisponiblesAdmin.filter(
        (item) => item.id !== idBtnEliminar,
      );
      guardarEnStorage(CLAVE_SERVICIOS, serviciosDisponiblesAdmin);
      actualizarServiciosAdmin();
      actualizarCategoriasAdmin();
      mostrarAviso('Se eliminó correctamente', 'success');
    }
  }
}
escucharEvento('box-lista-servicios', 'click', eliminarServicioAdmin);

// BOTON GUARDAR NUEVO SERVICIO (PESTAÑA SERVICIOS)

function crearNuevoServicio(evento) {
  evento.preventDefault();

  const nuevoServicio = {
    id: generarId(),
    nombre: leerCampo('nombre-servicio'),
    categoria: leerCampo('categoria-servicio').toLowerCase(),
    precio: Number(leerCampo('precio-servicio')),
    unidad: leerCampo('unidad-servicio'),
  };

  if (nuevoServicio.nombre === '') {
    mostrarAviso('Escribí el nombre del servicio.');
    return;
  }
  if (nuevoServicio.categoria === '') {
    mostrarAviso('Escribí o elegí la categoría del servicio.');
    return;
  }
  if (nuevoServicio.precio <= 0) {
    mostrarAviso('El precio tiene que ser mayor a 0.');
    return;
  }

  serviciosDisponiblesAdmin.push(nuevoServicio);
  guardarEnStorage(CLAVE_SERVICIOS, serviciosDisponiblesAdmin);
  actualizarServiciosAdmin();
  actualizarCategoriasAdmin();
  mostrarAviso('Servicio cargado correctamente.', 'success');

  cerrarYLimpiarModal('modalNuevoServicio', 'form-servicio');
}
escucharEvento('form-servicio', 'submit', crearNuevoServicio);

// BOTON ELIMINAR CLIENTE (PESTAÑA CLIENTES)

async function eliminarClienteAdmin(evento) {
  const btnEliminar = evento.target.closest('.btn-eliminar-cliente-admin');
  if (btnEliminar) {
    const idBtnEliminar = Number(btnEliminar.dataset.id);
    const response = await modalCotizador.fire({
      icon: 'warning',
      title: 'Estás a punto de eliminar este cliente.',
      text: '¿Estás seguro de que querés borrarlo? Las cotizaciones que ya confirmaste no se van a modificar.',
      showCancelButton: true,
      confirmButtonText: 'Sí, borrar de forma permanente',
      cancelButtonText: 'Cancelar',
    });
    if (response.isConfirmed) {
      clientesDisponiblesAdmin = clientesDisponiblesAdmin.filter(
        (item) => item.id !== idBtnEliminar,
      );
      guardarEnStorage(CLAVE_CLIENTES, clientesDisponiblesAdmin);
      actualizarClientesAdmin();
      mostrarAviso('Se eliminó correctamente.', 'success');
    }
  }
}
escucharEvento('box-lista-clientes', 'click', eliminarClienteAdmin);

// BOTON GUARDAR NUEVO CLIENTE (PESTAÑA CLIENTES)

function crearNuevoCliente(evento) {
  evento.preventDefault();
  const nuevoCliente = {
    id: generarId(),
    nombre: leerCampo('nombre-cliente'),
    email: leerCampo('email-cliente').toLowerCase(),
    telefono: leerCampo('telefono-cliente'),
    ciudad: leerCampo('ciudad-cliente'),
    direccion: leerCampo('direccion-cliente'),
  };

  if (nuevoCliente.nombre === '') {
    mostrarAviso('Escribí el nombre o la empresa del cliente.');
    return;
  }
  if (nuevoCliente.email === '') {
    mostrarAviso('Debés escribir el email del cliente');
    return;
  }
  if (nuevoCliente.telefono.length < 8) {
    mostrarAviso('Debés colocar el número de teléfono del cliente valido');
    return;
  }

  clientesDisponiblesAdmin.push(nuevoCliente);
  guardarEnStorage(CLAVE_CLIENTES, clientesDisponiblesAdmin);
  actualizarClientesAdmin();
  mostrarAviso('Cliente cargado correctamente.', 'success');

  cerrarYLimpiarModal('modalNuevoCliente', 'form-cliente');
}
escucharEvento('form-cliente', 'submit', crearNuevoCliente);

// FORMULARIO DE EMPRESA (PESTAÑA EMPRESA)

function guardarDatosEmpresa(evento) {
  evento.preventDefault();
  const datosEmpresa = {
    nombre: leerCampo('emp-nombre'),
    telefono: leerCampo('emp-telefono'),
    email: leerCampo('emp-email').toLowerCase(),
    direccion: leerCampo('emp-direccion'),
    impuesto: Number(leerCampo('emp-impuesto')),
  };

  if (datosEmpresa.nombre === '') {
    mostrarAviso('Escribí tu nombre completo o el de la empresa.');
    return;
  }
  if (datosEmpresa.email === '') {
    mostrarAviso('Debés escribir tu email.');
    return;
  }
  if (datosEmpresa.telefono.length < 8) {
    mostrarAviso('Debés colocar un número de teléfono válido');
    return;
  }

  guardarEnStorage(CLAVE_EMPRESA, datosEmpresa);
  mostrarAviso('Datos de la empresa cargados correctamente', 'success');
  mostrarNombreEmpresa();
}
escucharEvento('form-empresa', 'submit', guardarDatosEmpresa);

function mostrarDatosEmpresa() {
  const datosEmpresa = leerStorage(CLAVE_EMPRESA, null);
  if (datosEmpresa !== null) {
    escribirCampo('emp-nombre', datosEmpresa.nombre);
    escribirCampo('emp-telefono', datosEmpresa.telefono);
    escribirCampo('emp-email', datosEmpresa.email);
    escribirCampo('emp-direccion', datosEmpresa.direccion);
    escribirCampo('emp-impuesto', datosEmpresa.impuesto);
  }
}

async function iniciarAdmin() {
  serviciosDisponiblesAdmin = await traerTodosLosServicios('../');
  clientesDisponiblesAdmin = await traerTodosLosClientes('../');
  actualizarServiciosAdmin();
  actualizarCategoriasAdmin();
  actualizarClientesAdmin();
  mostrarDatosEmpresa();
}

function iniciarPagina() {
  const contenedorHistorial = document.getElementById(
    'box-historial-cotizacion',
  );
  const contenedorServicios = document.getElementById('box-lista-servicios');
  if (contenedorHistorial) {
    iniciarHistorial();
  } else if (contenedorServicios) {
    iniciarAdmin();
  }
}

iniciarPagina();
