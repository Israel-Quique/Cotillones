const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const nowIso = () => new Date().toISOString();

const usuariosPersonales = [
  { id: 'PER-001', username: 'admin', password: 'admin', rol: 'ADMIN' },
];

const clientesAuth = [
  { id: 'CLI-001', usuario_cliente: 'cliente', contrasena_cliente: 'cliente', rol: 'CLIENTE' },
];

const categorias = [
  { id_categoria: 'CAT-01', nombre: 'Globos' },
  { id_categoria: 'CAT-02', nombre: 'Cotillon' },
  { id_categoria: 'CAT-03', nombre: 'Decoracion' },
];

const temporadas = [
  { id_temporada: 'TEMP-01', nombre: 'Navidad' },
  { id_temporada: 'TEMP-02', nombre: 'Carnaval' },
  { id_temporada: 'TEMP-03', nombre: 'Cumpleanos' },
];

let ubicaciones = [
  {
    id_ubicacion: 1,
    descripcion: 'Estante A1',
    codigo_qr: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23ffffff"/><path d="M12 12h96v96H12z" fill="%230f172a"/><path d="M24 24h24v24H24zM72 24h24v24H72zM24 72h24v24H24z" fill="%23ffffff"/><path d="M56 56h16v16H56zM80 80h16v16H80zM56 80h16v16H56z" fill="%23ffffff"/></svg>',
    zona_abc: 'A',
    nivel: 1,
    capacidad: 120,
    fecha_registro: nowIso().slice(0, 10),
  },
  {
    id_ubicacion: 2,
    descripcion: 'Estante B2',
    codigo_qr: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23ffffff"/><path d="M12 12h96v96H12z" fill="%231e293b"/><path d="M24 24h24v24H24zM72 24h24v24H72zM24 72h24v24H24z" fill="%23ffffff"/><path d="M56 24h8v48h-8zM80 56h16v8H80zM56 80h24v8H56z" fill="%23ffffff"/></svg>',
    zona_abc: 'B',
    nivel: 2,
    capacidad: 90,
    fecha_registro: nowIso().slice(0, 10),
  },
];

const estadosProducto = [
  { id_estado_producto: 1, nombre: 'Activo' },
  { id_estado_producto: 2, nombre: 'Inactivo' },
];

const estadosProveedor = [
  { id_estado_proveedor: 1, nombre: 'Activo' },
  { id_estado_proveedor: 2, nombre: 'Inactivo' },
];

const tiposUsuario = [
  { id_tipo_usuario: 1, nombre: 'Administrador' },
  { id_tipo_usuario: 2, nombre: 'Vendedor' },
  { id_tipo_usuario: 3, nombre: 'Almacen' },
];

let productos = [
  {
    id_producto: 'PROD-001',
    nombre: 'Globo metalizado estrella',
    descripcion: 'Paquete por 10 unidades',
    precio_unidad: 12,
    precio_cantidad: 100,
    url_imagen: null,
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
    cantidad_stock: 85,
    categoria_id: 'CAT-01',
    temporada_id: 'TEMP-03',
    estado_producto_id: 1,
    ubicacion_id: 1,
    categoria_abc: 'A',
    categoria_abc_cantidad: 'A',
    categoria_abc_valor: 'A',
    puntos_abc_cantidad: 5,
    puntos_abc_valor: 5,
    cantidad_total_vendida: 120,
    valor_total_vendido: 1440,
    costo_de_producto: 8,
    demanda_anual: 300,
    costo_ordenar: 25,
    costo_mantenimiento: 2,
    eoq: 50,
    punto_reorden: 20,
    tiempo_entrega_dias: 3,
    stock_seguridad: 10,
    qr_producto: '',
  },
];

let clientes = [
  {
    id_cliente: 'CLI-001',
    nombre: 'Andrea',
    apellido: 'Flores',
    carnet_identidad: '1234567',
    email: 'andrea@cotillon.com',
    telefono: '70000001',
    direccion: 'Zona Central',
    estado_id: 1,
    fecha_creacion: nowIso(),
  },
];

let personal = [
  {
    id_personal: 'PER-001',
    nombre: 'Ricky',
    apellido: 'Admin',
    email: 'admin@cotillon.com',
    telefono: '70000002',
    usuario_personal: 'admin',
    tipo_usuario_id: 1,
    estado_personal_id: 1,
    activo: true,
    imagen_perfil: null,
  },
];

let proveedores = [
  {
    id_proveedor_producto: 'PROV-001',
    nombre_proveedor: 'Distribuidora Fiesta SRL',
    contacto: 'Maria',
    telefono: '70000003',
    email: 'ventas@fiesta.com',
    direccion: 'El Alto',
    notas: 'Entrega semanal',
    estado_proveedor_id: 1,
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
  },
];

let ventas = [];
let moldes = [];
let pedidos = [
  {
    id_pedido: 'PED-001',
    cliente_id: 'CLI-001',
    personal_id: 'PER-001',
    numero_pedido: 'PED-001',
    fecha_pedido: nowIso(),
    fecha_evento: '2026-07-05',
    descripcion_pedido: 'Decoracion para cumpleanos infantil',
    productos_pedido: 'Globos metalizados, vasos y serpentinas',
    precio_total: 420,
    acuenta: 150,
    saldo: 270,
    terminos_condiciones: 'Entrega previa de 24 horas',
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
    estado_pedido_id: 2,
    requiere_flete: true,
    direccion_entrega: 'Zona Sur, Calle 10',
    observaciones: 'Coordinar entrega por la manana',
  },
];
let combos = [
  {
    id_combo: 'COMBO-001',
    nombre: 'Kit Cumpleanos 20 Personas',
    descripcion: 'Globos, velas, gorros, serpentinas y vasos tematicos.',
    precio_combo: 185,
    descuento_porcentaje: 10,
    activo: true,
    items: [
      { id_producto: 'PROD-001', cantidad: 5 },
    ],
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
  },
];
let calendarioTemporadas = [
  {
    id_evento: 'TEMP-EVT-001',
    nombre: 'Campana Carnaval',
    temporada_id: 'TEMP-02',
    fecha_inicio: '2026-01-10',
    fecha_fin: '2026-02-28',
    objetivo_ventas_bs: 25000,
    presupuesto_bs: 8000,
    estado: 'planificado',
    notas: 'Promocionar combos de carnaval y mascaras.',
  },
];
let cierresCaja = [];
let cotizacionesTelegram = [];

const pedidoEstadoMap = {
  1: 'activo',
  2: 'pendiente',
  3: 'entregado',
  4: 'cancelado',
};

const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const generateId = (prefix, collection, key) => {
  const next = collection.length + 1;
  const id = `${prefix}-${String(next).padStart(3, '0')}`;
  if (collection.some((item) => item[key] === id)) {
    return `${prefix}-${Date.now()}`;
  }
  return id;
};

const normalizeDateOnly = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

const buildDailySales = () => {
  const grouped = ventas.reduce((acc, venta) => {
    const day = normalizeDateOnly(venta.fecha_venta) || nowIso().slice(0, 10);
    if (!acc[day]) {
      acc[day] = { fecha_dia: day, ventas_totales_dia: 0, cantidad_ventas: 0 };
    }

    acc[day].ventas_totales_dia += toNumber(venta.total, 0);
    acc[day].cantidad_ventas += 1;
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => String(b.fecha_dia).localeCompare(String(a.fecha_dia)));
};

const buildProductSalesTrend = () => {
  const grouped = {};

  ventas.forEach((venta) => {
    (venta.productos_vendidos || []).forEach((line) => {
      const id = String(line.id_producto || '');
      const producto = productos.find((item) => String(item.id_producto) === id);

      if (!grouped[id]) {
        grouped[id] = {
          producto_id: id,
          producto_nombre: producto?.nombre || id || 'Sin producto',
          cantidad_vendida: 0,
          ventas_totales_bs: 0,
          ultima_fecha_venta: null,
        };
      }

      grouped[id].cantidad_vendida += toNumber(line.cantidad, 0);
      grouped[id].ventas_totales_bs += toNumber(line.subtotal, 0);

      const saleDate = normalizeDateOnly(venta.fecha_venta);
      if (!grouped[id].ultima_fecha_venta || (saleDate && saleDate > grouped[id].ultima_fecha_venta)) {
        grouped[id].ultima_fecha_venta = saleDate;
      }
    });
  });

  return Object.values(grouped).sort((a, b) => toNumber(b.ventas_totales_bs, 0) - toNumber(a.ventas_totales_bs, 0));
};

const buildFreightRows = () =>
  pedidos
    .filter((pedido) => pedido.requiere_flete)
    .map((pedido) => ({
      id_flete: `FLE-${String(pedido.id_pedido || '').replace('PED-', '') || Date.now()}`,
      pedido_id: pedido.id_pedido,
      cliente_id: pedido.cliente_id,
      direccion_entrega: pedido.direccion_entrega || 'Sin direccion',
      fecha_evento: pedido.fecha_evento || null,
      estado_logistico: pedidoEstadoMap[toNumber(pedido.estado_pedido_id, 2)] || 'pendiente',
    }));

const abcScoreMap = { A: 3, B: 2, C: 1 };

const classifyAbcByShare = (share) => {
  if (share <= 0.8) {
    return 'A';
  }
  if (share <= 0.95) {
    return 'B';
  }
  return 'C';
};

const classifyAbcByScore = (quantityClass, valueClass) => {
  const quantityScore = abcScoreMap[quantityClass] || 1;
  const valueScore = abcScoreMap[valueClass] || 1;
  const average = (quantityScore + valueScore) / 2;

  if (average >= 2.5) {
    return 'A';
  }
  if (average >= 1.75) {
    return 'B';
  }
  return 'C';
};

const recomputeInventoryModels = () => {
  const quantityRows = productos.map((producto) => ({
    id_producto: producto.id_producto,
    quantityValue: Math.max(
      toNumber(
        producto.demanda_anual == null || producto.demanda_anual === ''
          ? producto.cantidad_total_vendida
          : producto.demanda_anual,
        0
      ),
      0
    ),
  }));

  const monetaryRows = productos.map((producto) => ({
    id_producto: producto.id_producto,
    monetaryValue: Math.max(
      toNumber(
        producto.valor_total_vendido,
        toNumber(producto.precio_unidad, 0) *
          Math.max(
            toNumber(
              producto.demanda_anual == null || producto.demanda_anual === ''
                ? producto.cantidad_total_vendida
                : producto.demanda_anual,
              0
            ),
            0
          )
      ),
      0
    ),
  }));

  const totalQuantity = quantityRows.reduce((sum, row) => sum + row.quantityValue, 0);
  const totalMonetary = monetaryRows.reduce((sum, row) => sum + row.monetaryValue, 0);

  const quantityClassMap = {};
  const quantityPointsMap = {};
  let quantityAccumulated = 0;
  quantityRows
    .sort((a, b) => b.quantityValue - a.quantityValue)
    .forEach((row) => {
      quantityAccumulated += row.quantityValue;
      const share = totalQuantity > 0 ? quantityAccumulated / totalQuantity : 1;
      const abc = classifyAbcByShare(share);
      quantityClassMap[row.id_producto] = abc;
      quantityPointsMap[row.id_producto] = abcScoreMap[abc];
    });

  const monetaryClassMap = {};
  const monetaryPointsMap = {};
  let monetaryAccumulated = 0;
  monetaryRows
    .sort((a, b) => b.monetaryValue - a.monetaryValue)
    .forEach((row) => {
      monetaryAccumulated += row.monetaryValue;
      const share = totalMonetary > 0 ? monetaryAccumulated / totalMonetary : 1;
      const abc = classifyAbcByShare(share);
      monetaryClassMap[row.id_producto] = abc;
      monetaryPointsMap[row.id_producto] = abcScoreMap[abc];
    });

  productos = productos.map((producto) => {
    const demandaAnual = Math.max(
      toNumber(
        producto.demanda_anual == null || producto.demanda_anual === ''
          ? producto.cantidad_total_vendida
          : producto.demanda_anual,
        0
      ),
      0
    );
    const costoOrdenar = Math.max(toNumber(producto.costo_ordenar, 0), 0);
    const costoMantenimiento = Math.max(toNumber(producto.costo_mantenimiento, 0), 0);
    const tiempoEntregaDias = Math.max(toNumber(producto.tiempo_entrega_dias, 0), 0);
    const demandaDiaria = demandaAnual / 365;
    const stockSeguridadBase = Math.ceil(demandaDiaria * tiempoEntregaDias * 0.25);
    const stockSeguridad = Math.max(
      toNumber(
        producto.stock_seguridad == null || producto.stock_seguridad === ''
          ? stockSeguridadBase
          : producto.stock_seguridad,
        stockSeguridadBase
      ),
      0
    );
    const eoq =
      demandaAnual > 0 && costoOrdenar > 0 && costoMantenimiento > 0
        ? Math.round(Math.sqrt((2 * demandaAnual * costoOrdenar) / costoMantenimiento))
        : 0;
    const puntoReorden = Math.ceil(demandaDiaria * tiempoEntregaDias + stockSeguridad);
    const categoriaAbcCantidad = quantityClassMap[producto.id_producto] || 'C';
    const categoriaAbcValor = monetaryClassMap[producto.id_producto] || 'C';
    const categoriaAbcGeneral = classifyAbcByScore(categoriaAbcCantidad, categoriaAbcValor);

    return {
      ...producto,
      demanda_anual: demandaAnual,
      eoq,
      punto_reorden: puntoReorden,
      stock_seguridad: stockSeguridad,
      categoria_abc: categoriaAbcGeneral,
      categoria_abc_cantidad: categoriaAbcCantidad,
      categoria_abc_valor: categoriaAbcValor,
      puntos_abc_cantidad: quantityPointsMap[producto.id_producto] || 1,
      puntos_abc_valor: monetaryPointsMap[producto.id_producto] || 1,
      fecha_actualizacion: nowIso(),
    };
  });
};

const createPedidoFromBody = (body = {}) => {
  const total = toNumber(body.precio_total, 0);
  const acuenta = toNumber(body.acuenta, 0);
  const generatedId = generateId('PED', pedidos, 'id_pedido');

  return {
    id_pedido: body.id_pedido || generatedId,
    cliente_id: body.cliente_id || null,
    personal_id: body.personal_id || null,
    numero_pedido: body.numero_pedido || generatedId,
    fecha_pedido: body.fecha_pedido || nowIso(),
    fecha_evento: body.fecha_evento || nowIso().slice(0, 10),
    descripcion_pedido: body.descripcion_pedido || null,
    productos_pedido: body.productos_pedido || null,
    precio_total: total,
    acuenta,
    saldo: body.saldo == null ? Math.max(total - acuenta, 0) : toNumber(body.saldo, 0),
    terminos_condiciones: body.terminos_condiciones || null,
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
    estado_pedido_id: toNumber(body.estado_pedido_id, 2),
    requiere_flete: Boolean(body.requiere_flete),
    direccion_entrega: body.direccion_entrega || null,
    observaciones: body.observaciones || null,
  };
};

const generarToken = (usuario) => {
  const base = `${usuario.username || usuario.usuario_cliente || usuario.usuario_personal}:${Date.now()}`;
  return Buffer.from(base).toString('base64');
};

const emitInventoryEvent = (channel, reason) => {
  io.emit('inventory:event', {
    channel,
    reason,
    timestamp: Date.now(),
  });
};

io.on('connection', (socket) => {
  socket.on('inventory:event:client', (event) => {
    if (!event?.channel) {
      return;
    }
    io.emit('inventory:event', {
      channel: event.channel,
      reason: event.reason || 'updated',
      timestamp: Date.now(),
    });
  });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'cotillon-mock-api', timestamp: nowIso() });
});

app.post('/login-personal', (req, res) => {
  const { username, password } = req.body;
  const usuario = usuariosPersonales.find(
    (u) => u.username === username && u.password === password
  );

  if (!usuario) {
    return res.status(401).json({ error: 'Credenciales de personal incorrectas' });
  }

  return res.json({
    message: 'Login de personal exitoso',
    token: generarToken(usuario),
    rol: usuario.rol,
    personal_id: usuario.id,
  });
});

app.post('/login-cliente', (req, res) => {
  const { usuario_cliente, contrasena_cliente } = req.body;
  const cliente = clientesAuth.find(
    (c) => c.usuario_cliente === usuario_cliente && c.contrasena_cliente === contrasena_cliente
  );

  if (!cliente) {
    return res.status(401).json({ error: 'Credenciales de cliente incorrectas' });
  }

  return res.json({
    message: 'Login de cliente exitoso',
    token: generarToken(cliente),
    rol: cliente.rol,
    cliente_id: cliente.id,
  });
});

app.get('/productos', (_req, res) => res.json(productos));
app.post('/productos', (req, res) => {
  const body = req.body || {};
  const nuevo = {
    id_producto: generateId('PROD', productos, 'id_producto'),
    nombre: body.nombre || 'Sin nombre',
    descripcion: body.descripcion || null,
    precio_unidad: toNumber(body.precio_unidad),
    precio_cantidad: toNumber(body.precio_cantidad),
    url_imagen: body.url_imagen || null,
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
    cantidad_stock: toNumber(body.cantidad_stock),
    categoria_id: body.categoria_id || categorias[0].id_categoria,
    temporada_id: body.temporada_id || null,
    estado_producto_id: toNumber(body.estado_producto_id, 1),
    ubicacion_id: toNumber(body.ubicacion_id, 1),
    categoria_abc: body.categoria_abc || 'C',
    categoria_abc_cantidad: body.categoria_abc_cantidad || 'C',
    categoria_abc_valor: body.categoria_abc_valor || 'C',
    puntos_abc_cantidad: toNumber(body.puntos_abc_cantidad, 1),
    puntos_abc_valor: toNumber(body.puntos_abc_valor, 1),
    cantidad_total_vendida: toNumber(body.cantidad_total_vendida),
    valor_total_vendido: toNumber(body.valor_total_vendido),
    costo_de_producto: toNumber(body.costo_de_producto),
    demanda_anual: body.demanda_anual == null || body.demanda_anual === '' ? null : toNumber(body.demanda_anual),
    costo_ordenar: body.costo_ordenar == null || body.costo_ordenar === '' ? null : toNumber(body.costo_ordenar),
    costo_mantenimiento: body.costo_mantenimiento == null || body.costo_mantenimiento === '' ? null : toNumber(body.costo_mantenimiento),
    eoq: body.eoq == null || body.eoq === '' ? null : toNumber(body.eoq),
    punto_reorden: body.punto_reorden == null || body.punto_reorden === '' ? null : toNumber(body.punto_reorden),
    tiempo_entrega_dias: body.tiempo_entrega_dias == null || body.tiempo_entrega_dias === '' ? null : toNumber(body.tiempo_entrega_dias),
    stock_seguridad: body.stock_seguridad == null || body.stock_seguridad === '' ? null : toNumber(body.stock_seguridad),
    qr_producto: body.qr_producto || '',
  };

  productos.push(nuevo);
  emitInventoryEvent('productos', 'created');
  res.status(201).json(nuevo);
});
app.put('/productos/:id', (req, res) => {
  const idx = productos.findIndex((p) => p.id_producto === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  productos[idx] = { ...productos[idx], ...req.body, fecha_actualizacion: nowIso() };
  emitInventoryEvent('productos', 'updated');
  return res.json(productos[idx]);
});
app.delete('/productos/:id', (req, res) => {
  const before = productos.length;
  productos = productos.filter((p) => p.id_producto !== req.params.id);
  if (before === productos.length) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  emitInventoryEvent('productos', 'deleted');
  return res.status(204).send();
});
app.put('/productos/:id/estado', (req, res) => {
  const producto = productos.find((p) => p.id_producto === req.params.id);
  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  producto.estado_producto_id = toNumber(req.body?.estado_producto_id, 1);
  producto.fecha_actualizacion = nowIso();
  emitInventoryEvent('productos', 'status-updated');
  return res.json(producto);
});

app.get('/clientes', (_req, res) => res.json(clientes));
app.get('/clientes/nombres', (_req, res) => res.json(clientes.map((c) => ({ id_cliente: c.id_cliente, nombre: c.nombre, apellido: c.apellido }))));
app.get('/clientes/:id', (req, res) => {
  const item = clientes.find((c) => String(c.id_cliente) === String(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }
  return res.json(item);
});
app.get('/clientes/buscar-por-carnet/:carnet', (req, res) => {
  const item = clientes.find((c) => String(c.carnet_identidad) === String(req.params.carnet));
  if (!item) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }
  return res.json(item);
});
app.post('/clientes', (req, res) => {
  const nuevo = {
    id_cliente: generateId('CLI', clientes, 'id_cliente'),
    estado_id: 1,
    fecha_creacion: nowIso(),
    ...req.body,
  };
  clientes.push(nuevo);
  emitInventoryEvent('clientes', 'created');
  res.status(201).json(nuevo);
});
app.put('/clientes/:id', (req, res) => {
  const idx = clientes.findIndex((c) => String(c.id_cliente) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }
  clientes[idx] = { ...clientes[idx], ...req.body };
  emitInventoryEvent('clientes', 'updated');
  return res.json(clientes[idx]);
});
app.put('/clientes/:id/estado', (req, res) => {
  const item = clientes.find((c) => String(c.id_cliente) === String(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }
  item.estado_id = toNumber(req.body?.estado_id, 1);
  emitInventoryEvent('clientes', 'status-updated');
  return res.json(item);
});
app.delete('/clientes/:id', (req, res) => {
  const before = clientes.length;
  clientes = clientes.filter((c) => String(c.id_cliente) !== String(req.params.id));
  if (before === clientes.length) {
    return res.status(404).json({ error: 'Cliente no encontrado' });
  }
  emitInventoryEvent('clientes', 'deleted');
  return res.status(204).send();
});

app.get('/personal', (_req, res) => res.json(personal));
app.get('/personal/nombres', (_req, res) => res.json(personal.map((p) => ({ id_personal: p.id_personal, nombre_personal: `${p.nombre || ''} ${p.apellido || ''}`.trim() }))));
app.post('/personal', (req, res) => {
  const nuevo = {
    id_personal: generateId('PER', personal, 'id_personal'),
    estado_personal_id: 1,
    activo: true,
    ...req.body,
  };
  personal.push(nuevo);
  emitInventoryEvent('personal', 'created');
  res.status(201).json(nuevo);
});
app.put('/personal/:id', (req, res) => {
  const idx = personal.findIndex((p) => String(p.id_personal) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Personal no encontrado' });
  }
  personal[idx] = { ...personal[idx], ...req.body };
  emitInventoryEvent('personal', 'updated');
  return res.json(personal[idx]);
});
app.delete('/personal/:id', (req, res) => {
  const before = personal.length;
  personal = personal.filter((p) => String(p.id_personal) !== String(req.params.id));
  if (before === personal.length) {
    return res.status(404).json({ error: 'Personal no encontrado' });
  }
  emitInventoryEvent('personal', 'deleted');
  return res.status(204).send();
});

app.get('/ventas', (_req, res) => res.json(ventas));
app.post('/ventas', (req, res) => {
  const venta = {
    id_venta: generateId('VEN', ventas, 'id_venta'),
    fecha_venta: req.body?.fecha_venta || nowIso(),
    cliente_id: req.body?.cliente_id,
    personal_id: req.body?.personal_id,
    total: toNumber(req.body?.total),
    notas: req.body?.notas || null,
    productos_vendidos: Array.isArray(req.body?.productos_vendidos) ? req.body.productos_vendidos : [],
  };

  venta.productos_vendidos.forEach((line) => {
    const prod = productos.find((p) => String(p.id_producto) === String(line.id_producto));
    if (prod) {
      prod.cantidad_stock = Math.max(0, toNumber(prod.cantidad_stock) - toNumber(line.cantidad, 0));
      prod.cantidad_total_vendida = toNumber(prod.cantidad_total_vendida) + toNumber(line.cantidad, 0);
      prod.valor_total_vendido = toNumber(prod.valor_total_vendido) + toNumber(line.subtotal, 0);
      prod.fecha_actualizacion = nowIso();
    }
  });

  ventas.push(venta);
  emitInventoryEvent('ventas', 'created');
  emitInventoryEvent('productos', 'stock-updated');
  res.status(201).json(venta);
});
app.put('/ventas/:id', (req, res) => {
  const idx = ventas.findIndex((v) => String(v.id_venta) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Venta no encontrada' });
  }
  ventas[idx] = { ...ventas[idx], ...req.body };
  emitInventoryEvent('ventas', 'updated');
  return res.json(ventas[idx]);
});
app.delete('/ventas/:id', (req, res) => {
  const idx = ventas.findIndex((v) => String(v.id_venta) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Venta no encontrada' });
  }

  const venta = ventas[idx];
  (venta.productos_vendidos || []).forEach((line) => {
    const prod = productos.find((p) => String(p.id_producto) === String(line.id_producto));
    if (prod) {
      prod.cantidad_stock = toNumber(prod.cantidad_stock) + toNumber(line.cantidad, 0);
      prod.fecha_actualizacion = nowIso();
    }
  });

  ventas.splice(idx, 1);
  emitInventoryEvent('ventas', 'deleted');
  emitInventoryEvent('productos', 'stock-restored');
  return res.status(204).send();
});

app.get('/proveedores-producto', (_req, res) => res.json(proveedores));
app.post('/proveedores-producto', (req, res) => {
  const nuevo = {
    id_proveedor_producto: generateId('PROV', proveedores, 'id_proveedor_producto'),
    estado_proveedor_id: 1,
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
    ...req.body,
  };
  proveedores.push(nuevo);
  emitInventoryEvent('proveedores', 'created');
  res.status(201).json(nuevo);
});
app.put('/proveedores-producto/:id', (req, res) => {
  const idx = proveedores.findIndex((p) => String(p.id_proveedor_producto) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Proveedor no encontrado' });
  }
  proveedores[idx] = { ...proveedores[idx], ...req.body, fecha_actualizacion: nowIso() };
  emitInventoryEvent('proveedores', 'updated');
  return res.json(proveedores[idx]);
});
app.put('/proveedores-producto/:id/estado', (req, res) => {
  const item = proveedores.find((p) => String(p.id_proveedor_producto) === String(req.params.id));
  if (!item) {
    return res.status(404).json({ error: 'Proveedor no encontrado' });
  }
  item.estado_proveedor_id = toNumber(req.body?.estado_proveedor_id, 1);
  item.fecha_actualizacion = nowIso();
  emitInventoryEvent('proveedores', 'status-updated');
  return res.json(item);
});
app.delete('/proveedores-producto/:id', (req, res) => {
  const before = proveedores.length;
  proveedores = proveedores.filter((p) => String(p.id_proveedor_producto) !== String(req.params.id));
  if (before === proveedores.length) {
    return res.status(404).json({ error: 'Proveedor no encontrado' });
  }
  emitInventoryEvent('proveedores', 'deleted');
  return res.status(204).send();
});

app.get('/moldes', (_req, res) => res.json(moldes));
app.post('/moldes', (req, res) => {
  const nuevo = {
    id_molde: generateId('MOL', moldes, 'id_molde'),
    ...req.body,
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
  };
  moldes.push(nuevo);
  return res.status(201).json(nuevo);
});
app.put('/moldes/:id', (req, res) => {
  const idx = moldes.findIndex((m) => String(m.id_molde) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Molde no encontrado' });
  }
  moldes[idx] = { ...moldes[idx], ...req.body, fecha_actualizacion: nowIso() };
  return res.json(moldes[idx]);
});
app.delete('/moldes/:id', (req, res) => {
  const before = moldes.length;
  moldes = moldes.filter((m) => String(m.id_molde) !== String(req.params.id));
  if (before === moldes.length) {
    return res.status(404).json({ error: 'Molde no encontrado' });
  }
  return res.status(204).send();
});
app.post('/moldes/analyze-image', (_req, res) => {
  return res.json({
    success: true,
    parts: [],
    grayscalePreview: null,
    transparentPreview: null,
  });
});

app.get('/pedidos', (_req, res) => res.json(pedidos));
app.get('/Pedidos', (_req, res) => res.json(pedidos));
app.post('/pedidos', (req, res) => {
  const nuevo = createPedidoFromBody(req.body || {});
  pedidos.push(nuevo);
  emitInventoryEvent('pedidos', 'created');
  res.status(201).json(nuevo);
});
app.post('/Pedidos', (req, res) => {
  const nuevo = createPedidoFromBody(req.body || {});
  pedidos.push(nuevo);
  emitInventoryEvent('pedidos', 'created');
  res.status(201).json(nuevo);
});
app.put('/pedidos/:id', (req, res) => {
  const idx = pedidos.findIndex((pedido) => String(pedido.id_pedido) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  const body = req.body || {};
  const total = body.precio_total == null ? pedidos[idx].precio_total : toNumber(body.precio_total, 0);
  const acuenta = body.acuenta == null ? pedidos[idx].acuenta : toNumber(body.acuenta, 0);
  pedidos[idx] = {
    ...pedidos[idx],
    ...body,
    precio_total: total,
    acuenta,
    saldo: body.saldo == null ? Math.max(total - acuenta, 0) : toNumber(body.saldo, 0),
    estado_pedido_id: body.estado_pedido_id == null ? pedidos[idx].estado_pedido_id : toNumber(body.estado_pedido_id, 2),
    requiere_flete: body.requiere_flete == null ? pedidos[idx].requiere_flete : Boolean(body.requiere_flete),
    fecha_actualizacion: nowIso(),
  };

  emitInventoryEvent('pedidos', 'updated');
  return res.json(pedidos[idx]);
});
app.put('/Pedidos/:id', (req, res) => {
  const idx = pedidos.findIndex((pedido) => String(pedido.id_pedido) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  const body = req.body || {};
  const total = body.precio_total == null ? pedidos[idx].precio_total : toNumber(body.precio_total, 0);
  const acuenta = body.acuenta == null ? pedidos[idx].acuenta : toNumber(body.acuenta, 0);
  pedidos[idx] = {
    ...pedidos[idx],
    ...body,
    precio_total: total,
    acuenta,
    saldo: body.saldo == null ? Math.max(total - acuenta, 0) : toNumber(body.saldo, 0),
    estado_pedido_id: body.estado_pedido_id == null ? pedidos[idx].estado_pedido_id : toNumber(body.estado_pedido_id, 2),
    requiere_flete: body.requiere_flete == null ? pedidos[idx].requiere_flete : Boolean(body.requiere_flete),
    fecha_actualizacion: nowIso(),
  };

  emitInventoryEvent('pedidos', 'updated');
  return res.json(pedidos[idx]);
});
app.delete('/pedidos/:id', (req, res) => {
  const before = pedidos.length;
  pedidos = pedidos.filter((pedido) => String(pedido.id_pedido) !== String(req.params.id));
  if (before === pedidos.length) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }
  emitInventoryEvent('pedidos', 'deleted');
  return res.status(204).send();
});
app.delete('/Pedidos/:id', (req, res) => {
  const before = pedidos.length;
  pedidos = pedidos.filter((pedido) => String(pedido.id_pedido) !== String(req.params.id));
  if (before === pedidos.length) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }
  emitInventoryEvent('pedidos', 'deleted');
  return res.status(204).send();
});

app.get('/combos', (_req, res) => res.json(combos));
app.post('/combos', (req, res) => {
  const body = req.body || {};
  const nuevo = {
    id_combo: generateId('COMBO', combos, 'id_combo'),
    nombre: body.nombre || 'Nuevo combo',
    descripcion: body.descripcion || null,
    precio_combo: toNumber(body.precio_combo, 0),
    descuento_porcentaje: toNumber(body.descuento_porcentaje, 0),
    activo: body.activo !== false,
    items: Array.isArray(body.items) ? body.items : [],
    fecha_creacion: nowIso(),
    fecha_actualizacion: nowIso(),
  };
  combos.push(nuevo);
  res.status(201).json(nuevo);
});
app.put('/combos/:id', (req, res) => {
  const idx = combos.findIndex((c) => String(c.id_combo) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Combo no encontrado' });
  }
  combos[idx] = { ...combos[idx], ...req.body, fecha_actualizacion: nowIso() };
  return res.json(combos[idx]);
});
app.delete('/combos/:id', (req, res) => {
  const before = combos.length;
  combos = combos.filter((c) => String(c.id_combo) !== String(req.params.id));
  if (before === combos.length) {
    return res.status(404).json({ error: 'Combo no encontrado' });
  }
  return res.status(204).send();
});

app.get('/calendario-temporadas', (_req, res) => res.json(calendarioTemporadas));
app.post('/calendario-temporadas', (req, res) => {
  const body = req.body || {};
  const nuevo = {
    id_evento: generateId('TEMP-EVT', calendarioTemporadas, 'id_evento'),
    nombre: body.nombre || 'Nueva campana',
    temporada_id: body.temporada_id || null,
    fecha_inicio: body.fecha_inicio || null,
    fecha_fin: body.fecha_fin || null,
    objetivo_ventas_bs: toNumber(body.objetivo_ventas_bs, 0),
    presupuesto_bs: toNumber(body.presupuesto_bs, 0),
    estado: body.estado || 'planificado',
    notas: body.notas || null,
  };
  calendarioTemporadas.push(nuevo);
  res.status(201).json(nuevo);
});
app.put('/calendario-temporadas/:id', (req, res) => {
  const idx = calendarioTemporadas.findIndex((e) => String(e.id_evento) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }
  calendarioTemporadas[idx] = { ...calendarioTemporadas[idx], ...req.body };
  return res.json(calendarioTemporadas[idx]);
});
app.delete('/calendario-temporadas/:id', (req, res) => {
  const before = calendarioTemporadas.length;
  calendarioTemporadas = calendarioTemporadas.filter((e) => String(e.id_evento) !== String(req.params.id));
  if (before === calendarioTemporadas.length) {
    return res.status(404).json({ error: 'Evento no encontrado' });
  }
  return res.status(204).send();
});

app.get('/cierres-caja', (_req, res) => res.json(cierresCaja));
app.post('/cierres-caja', (req, res) => {
  const body = req.body || {};
  const fecha = body.fecha || nowIso().slice(0, 10);
  const ventasDia = ventas.filter((v) => String(v.fecha_venta || '').slice(0, 10) === fecha);
  const totalVentas = ventasDia.reduce((sum, v) => sum + toNumber(v.total, 0), 0);
  const efectivo = toNumber(body.efectivo_bs, 0);
  const qr = toNumber(body.qr_bs, 0);
  const transferencia = toNumber(body.transferencia_bs, 0);
  const totalCaja = efectivo + qr + transferencia;
  const diferencia = totalCaja - totalVentas;

  const cierre = {
    id_cierre: generateId('CIERRE', cierresCaja, 'id_cierre'),
    fecha,
    responsable: body.responsable || 'Sin responsable',
    efectivo_bs: efectivo,
    qr_bs: qr,
    transferencia_bs: transferencia,
    total_ventas_bs: totalVentas,
    total_caja_bs: totalCaja,
    diferencia_bs: diferencia,
    observaciones: body.observaciones || null,
    creado_en: nowIso(),
  };

  cierresCaja.push(cierre);
  return res.status(201).json(cierre);
});

app.get('/cotizaciones-telegram', (_req, res) => res.json(cotizacionesTelegram));
app.post('/cotizaciones-telegram', (req, res) => {
  const body = req.body || {};
  const nueva = {
    id_cotizacion: generateId('COTI', cotizacionesTelegram, 'id_cotizacion'),
    nombre_cliente: body.nombre_cliente || 'Cliente sin nombre',
    telefono_telegram: body.telefono_telegram || '',
    evento: body.evento || 'General',
    fecha_evento: body.fecha_evento || null,
    detalle: body.detalle || null,
    monto_estimado_bs: toNumber(body.monto_estimado_bs, 0),
    estado: body.estado || 'pendiente',
    creado_en: nowIso(),
    actualizado_en: nowIso(),
  };
  cotizacionesTelegram.push(nueva);
  return res.status(201).json(nueva);
});
app.put('/cotizaciones-telegram/:id', (req, res) => {
  const idx = cotizacionesTelegram.findIndex((c) => String(c.id_cotizacion) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Cotizacion no encontrada' });
  }
  cotizacionesTelegram[idx] = { ...cotizacionesTelegram[idx], ...req.body, actualizado_en: nowIso() };
  return res.json(cotizacionesTelegram[idx]);
});

app.get('/categorias', (_req, res) => res.json(categorias));
app.get('/temporadas', (_req, res) => res.json(temporadas));
app.get('/fletes', (_req, res) => res.json(buildFreightRows()));
app.get('/ventas-diarias', (_req, res) => res.json(buildDailySales()));
app.get('/producto-ventas-diarias/:productoId', (req, res) => {
  const productoId = String(req.params.productoId);
  const rows = ventas
    .flatMap((venta) =>
      (venta.productos_vendidos || [])
        .filter((line) => String(line.id_producto) === productoId)
        .map((line) => ({
          fecha_dia: normalizeDateOnly(venta.fecha_venta),
          producto_id: productoId,
          producto_nombre:
            productos.find((item) => String(item.id_producto) === productoId)?.nombre || productoId,
          cantidad_vendida: toNumber(line.cantidad, 0),
          subtotal: toNumber(line.subtotal, 0),
        }))
    )
    .filter((row) => row.fecha_dia);

  res.json(rows);
});
app.get('/all-productos-ventas-diarias', (_req, res) => res.json(buildProductSalesTrend()));
app.get('/ubicaciones', (_req, res) => res.json(ubicaciones));
app.post('/ubicaciones', (req, res) => {
  const nuevo = {
    id_ubicacion: ubicaciones.length ? Math.max(...ubicaciones.map((u) => Number(u.id_ubicacion) || 0)) + 1 : 1,
    descripcion: req.body?.descripcion || 'Nueva ubicacion',
    codigo_qr: req.body?.codigo_qr || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23ffffff"/><path d="M12 12h96v96H12z" fill="%230f172a"/><path d="M24 24h24v24H24zM72 24h24v24H72zM24 72h24v24H24z" fill="%23ffffff"/><path d="M56 56h16v16H56zM80 80h16v16H80zM56 80h16v16H56z" fill="%23ffffff"/></svg>`,
    zona_abc: req.body?.zona_abc || 'C',
    nivel: req.body?.nivel == null || req.body?.nivel === '' ? null : toNumber(req.body?.nivel, 0),
    capacidad: req.body?.capacidad == null || req.body?.capacidad === '' ? null : toNumber(req.body?.capacidad, 0),
    fecha_registro: req.body?.fecha_registro || nowIso().slice(0, 10),
  };
  ubicaciones.push(nuevo);
  emitInventoryEvent('ubicaciones', 'created');
  res.status(201).json(nuevo);
});
app.put('/ubicaciones/:id', (req, res) => {
  const idx = ubicaciones.findIndex((u) => String(u.id_ubicacion) === String(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ error: 'Ubicacion no encontrada' });
  }
  ubicaciones[idx] = {
    ...ubicaciones[idx],
    ...req.body,
    nivel: req.body?.nivel == null || req.body?.nivel === '' ? ubicaciones[idx].nivel : toNumber(req.body?.nivel, 0),
    capacidad: req.body?.capacidad == null || req.body?.capacidad === '' ? ubicaciones[idx].capacidad : toNumber(req.body?.capacidad, 0),
  };
  emitInventoryEvent('ubicaciones', 'updated');
  res.json(ubicaciones[idx]);
});
app.delete('/ubicaciones/:id', (req, res) => {
  const before = ubicaciones.length;
  ubicaciones = ubicaciones.filter((u) => String(u.id_ubicacion) !== String(req.params.id));
  if (before === ubicaciones.length) {
    return res.status(404).json({ error: 'Ubicacion no encontrada' });
  }
  emitInventoryEvent('ubicaciones', 'deleted');
  res.status(204).send();
});
app.get('/estados-producto', (_req, res) => res.json(estadosProducto));
app.get('/estados-proveedor', (_req, res) => res.json(estadosProveedor));
app.get('/tipos-usuario', (_req, res) => res.json(tiposUsuario));

app.get('/exportar-productos', (_req, res) => res.json(productos));
app.get('/exportar-clientes', (_req, res) => res.json(clientes));
app.get('/exportar-resenas', (_req, res) => res.json([]));
app.get('/exportar-personal-entrega', (_req, res) => res.json(personal));

app.post('/upload-imagen', (_req, res) => res.json({ imageUrl: '/assets/images.png' }));
app.post('/upload-imagen-personal', (_req, res) => res.json({ imageUrl: '/assets/user.png' }));

app.put('/abc-con-valor-monetario', (_req, res) => {
  recomputeInventoryModels();

  emitInventoryEvent('productos', 'abc-updated');
  res.json({
    message: 'Analisis ABC y EOQ recalculado',
    total_productos: productos.length,
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock API server listening at http://localhost:${PORT}`);
});
